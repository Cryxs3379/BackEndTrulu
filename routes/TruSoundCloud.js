const express = require('express');
const fs = require('fs');
const path = require('path');
const musicPool = require('../musicDb');
const authenticate = require('../middleware/auth');

const router = express.Router();
const MUSIC_BASE_PATH = process.env.MEDIA_TRUSOUND_PATH || '/mnt/media/music';

router.use(authenticate);

router.get('/artists', async (_req, res) => {
  try {
    const { rows } = await musicPool.query(
      'SELECT id, name, description, image_url, created_at FROM tsc_artists ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching artists:', err);
    res.status(500).json({ message: 'Error al obtener artistas' });
  }
});

router.get('/artists/:id', async (req, res) => {
  try {
    const { rows } = await musicPool.query(
      'SELECT id, name, description, image_url, created_at FROM tsc_artists WHERE id = $1 LIMIT 1',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Artista no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching artist:', err);
    res.status(500).json({ message: 'Error al obtener artista' });
  }
});

router.get('/artists/:id/tracks', async (req, res) => {
  try {
    const { rows } = await musicPool.query(
      `SELECT id, title, filename, size, duration_seconds, year, created_at
       FROM tsc_tracks
       WHERE artist_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching tracks:', err);
    res.status(500).json({ message: 'Error al obtener canciones' });
  }
});

router.get('/tracks/:id', async (req, res) => {
  try {
    const { rows } = await musicPool.query(
      `SELECT id, title, filename, size, duration_seconds, year, artist_id, created_at
       FROM tsc_tracks
       WHERE id = $1 LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching track:', err);
    res.status(500).json({ message: 'Error al obtener canción' });
  }
});

router.get('/tracks/:id/stream', async (req, res) => {
  try {
    const { rows } = await musicPool.query(
      'SELECT filename FROM tsc_tracks WHERE id = $1 LIMIT 1',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }

    const filename = rows[0].filename;
    const safePath = path.normalize(path.join(MUSIC_BASE_PATH, filename));
    if (!safePath.startsWith(path.normalize(MUSIC_BASE_PATH))) {
      return res.status(400).json({ message: 'Ruta inválida' });
    }

    fs.stat(safePath, (err, stats) => {
      if (err || !stats.isFile()) {
        console.error('Audio file not found:', safePath, err);
        return res.status(404).json({ message: 'Archivo no disponible' });
      }

      const range = req.headers.range;
      const contentType = getContentType(safePath);

      if (!range) {
        res.writeHead(200, {
          'Content-Length': stats.size,
          'Content-Type': contentType,
        });
        fs.createReadStream(safePath).pipe(res);
        return;
      }

      const bytesPrefix = 'bytes=';
      if (!range.startsWith(bytesPrefix)) {
        return res.status(416).send('Header Range inválido');
      }

      const parts = range.replace(bytesPrefix, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
        return res.status(416).send('Rango inválido');
      }

      const chunkSize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      fs.createReadStream(safePath, { start, end }).pipe(res);
    });
  } catch (err) {
    console.error('Error streaming track:', err);
    res.status(500).json({ message: 'Error al reproducir la canción' });
  }
});

// =========================
// FAVORITOS
// =========================

router.get('/favorites', async (req, res) => {
  try {
    const { rows } = await musicPool.query(
      `SELECT t.id, t.title, t.filename, t.size, t.duration_seconds, t.year,
              t.artist_id, f.created_at
       FROM tsc_user_favorites f
       JOIN tsc_tracks t ON t.id = f.track_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo favoritos:', err);
    res.status(500).json({ message: 'Error al obtener favoritos' });
  }
});

router.post('/favorites', async (req, res) => {
  const { trackId } = req.body;
  if (!trackId) {
    return res.status(400).json({ message: 'trackId es obligatorio' });
  }

  try {
    const insert = await musicPool.query(
      `INSERT INTO tsc_user_favorites (user_id, track_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, track_id) DO NOTHING
       RETURNING id`,
      [req.user.id, trackId]
    );

    if (!insert.rowCount) {
      return res.json({ message: 'La canción ya estaba en favoritos' });
    }

    res.status(201).json({ message: 'Añadida a favoritos' });
  } catch (err) {
    console.error('Error al agregar favorito:', err);
    res.status(500).json({ message: 'Error al agregar a favoritos' });
  }
});

router.delete('/favorites/:trackId', async (req, res) => {
  try {
    await musicPool.query(
      'DELETE FROM tsc_user_favorites WHERE user_id = $1 AND track_id = $2',
      [req.user.id, req.params.trackId]
    );
    res.json({ message: 'Eliminado de favoritos' });
  } catch (err) {
    console.error('Error al eliminar favorito:', err);
    res.status(500).json({ message: 'Error al eliminar de favoritos' });
  }
});

// =========================
// PLAYLISTS
// =========================

router.get('/playlists/mine', async (req, res) => {
  try {
    const { rows } = await musicPool.query(
      `SELECT id, name, description, is_public, created_at
       FROM tsc_playlists
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo playlists del usuario:', err);
    res.status(500).json({ message: 'Error al obtener tus playlists' });
  }
});

router.get('/playlists/public', async (_req, res) => {
  try {
    const { rows } = await musicPool.query(
      `SELECT p.id, p.name, p.description, p.is_public, p.created_at,
              p.user_id, u.email AS owner_email
       FROM tsc_playlists p
       JOIN users_music u ON u.id = p.user_id
       WHERE p.is_public = TRUE
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo playlists públicas:', err);
    res.status(500).json({ message: 'Error al obtener playlists públicas' });
  }
});

router.post('/playlists', async (req, res) => {
  const { name, description, is_public } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'El nombre de la playlist es obligatorio' });
  }

  try {
    const { rows } = await musicPool.query(
      `INSERT INTO tsc_playlists (user_id, name, description, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, is_public, created_at`,
      [req.user.id, name, description || null, Boolean(is_public)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creando playlist:', err);
    res.status(500).json({ message: 'Error al crear la playlist' });
  }
});

router.get('/playlists/:id', async (req, res) => {
  try {
    const playlist = await fetchPlaylistWithOwner(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist no encontrada' });
    }

    if (!playlist.is_public && playlist.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Playlist no encontrada o no es tuya' });
    }

    const tracks = await fetchPlaylistTracks(req.params.id);

    res.json({
      ...playlist,
      tracks
    });
  } catch (err) {
    console.error('Error obteniendo playlist:', err);
    res.status(500).json({ message: 'Error al obtener la playlist' });
  }
});

router.post('/playlists/:id/tracks', async (req, res) => {
  const { trackId, position } = req.body;
  if (!trackId) {
    return res.status(400).json({ message: 'trackId es obligatorio' });
  }

  try {
    const playlist = await fetchPlaylistWithOwner(req.params.id);
    if (!playlist || playlist.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Playlist no encontrada o no es tuya' });
    }

    const insert = await musicPool.query(
      `INSERT INTO tsc_playlist_tracks (playlist_id, track_id, position)
       VALUES ($1, $2, $3)
       ON CONFLICT (playlist_id, track_id) DO NOTHING
       RETURNING id`,
      [req.params.id, trackId, position ?? null]
    );

    if (!insert.rowCount) {
      return res.json({ message: 'La canción ya estaba en la playlist' });
    }

    res.status(201).json({ message: 'Canción añadida a la playlist' });
  } catch (err) {
    console.error('Error añadiendo canción a playlist:', err);
    res.status(500).json({ message: 'Error al añadir la canción' });
  }
});

router.delete('/playlists/:id/tracks/:trackId', async (req, res) => {
  try {
    const playlist = await fetchPlaylistWithOwner(req.params.id);
    if (!playlist || playlist.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Playlist no encontrada o no es tuya' });
    }

    await musicPool.query(
      'DELETE FROM tsc_playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
      [req.params.id, req.params.trackId]
    );

    res.json({ message: 'Canción eliminada de la playlist' });
  } catch (err) {
    console.error('Error eliminando canción de playlist:', err);
    res.status(500).json({ message: 'Error al eliminar la canción' });
  }
});

router.delete('/playlists/:id', async (req, res) => {
  try {
    const playlist = await fetchPlaylistWithOwner(req.params.id);
    if (!playlist || playlist.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Playlist no encontrada o no es tuya' });
    }

    await musicPool.query('DELETE FROM tsc_playlists WHERE id = $1', [req.params.id]);
    res.json({ message: 'Playlist eliminada' });
  } catch (err) {
    console.error('Error eliminando playlist:', err);
    res.status(500).json({ message: 'Error al eliminar la playlist' });
  }
});

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.flac') return 'audio/flac';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.ogg') return 'audio/ogg';
  return 'application/octet-stream';
}

async function fetchPlaylistWithOwner(id) {
  const { rows } = await musicPool.query(
    `SELECT p.id, p.name, p.description, p.is_public, p.created_at,
            p.user_id, u.email AS owner_email
     FROM tsc_playlists p
     JOIN users_music u ON u.id = p.user_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0];
}

async function fetchPlaylistTracks(playlistId) {
  const { rows } = await musicPool.query(
    `SELECT t.id, t.title, t.filename, t.size, t.duration_seconds, t.year,
            t.artist_id, ppt.position, ppt.added_at
     FROM tsc_playlist_tracks ppt
     JOIN tsc_tracks t ON t.id = ppt.track_id
     WHERE ppt.playlist_id = $1
     ORDER BY COALESCE(ppt.position, ppt.added_at), ppt.added_at`,
    [playlistId]
  );
  return rows;
}

module.exports = router;

