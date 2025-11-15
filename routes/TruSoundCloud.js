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

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.flac') return 'audio/flac';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.ogg') return 'audio/ogg';
  return 'application/octet-stream';
}

module.exports = router;

