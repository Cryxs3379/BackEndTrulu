const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const mediaPool = require('../mediaDb');
const authenticate = require('../middleware/auth');

const MEDIA_BASE_PATH = process.env.MEDIA_BASE_PATH || '/mnt/media/movies';

// GET /api/biblioteca - Obtener todas las películas
router.get('/', authenticate, async (_req, res) => {
  try {
    const { rows } = await mediaPool.query(
      'SELECT id, title, filename, size, year, created_at FROM movies ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching movies:', err);
    res.status(500).json({ message: 'Error al obtener las películas' });
  }
});

// GET /api/biblioteca/:id/stream - reproducir película
router.get('/:id/stream', authenticate, async (req, res) => {
  try {
    const { rows } = await mediaPool.query(
      'SELECT filename FROM movies WHERE id = $1',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Película no encontrada' });
    }

    const safeFilename = path.basename(rows[0].filename);
    const moviePath = path.join(MEDIA_BASE_PATH, safeFilename);

    fs.stat(moviePath, (err, stats) => {
      if (err || !stats.isFile()) {
        console.error('File not found for streaming:', moviePath, err);
        return res.status(404).json({ message: 'Archivo no disponible' });
      }

      const range = req.headers.range;
      const contentType = getContentType(moviePath);

      if (!range) {
        res.writeHead(200, {
          'Content-Length': stats.size,
          'Content-Type': contentType,
        });
        fs.createReadStream(moviePath).pipe(res);
        return;
      }

      const bytesPrefix = 'bytes=';
      if (!range.startsWith(bytesPrefix)) {
        return res.status(416).send('Header Range inválido');
      }

      const rangeParts = range.replace(bytesPrefix, '').split('-');
      const start = parseInt(rangeParts[0], 10);
      const end = rangeParts[1] ? parseInt(rangeParts[1], 10) : stats.size - 1;

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

      fs.createReadStream(moviePath, { start, end }).pipe(res);
    });
  } catch (err) {
    console.error('Error streaming movie:', err);
    res.status(500).json({ message: 'Error al reproducir la película' });
  }
});

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mkv') return 'video/x-matroska';
  if (ext === '.mov') return 'video/quicktime';
  return 'application/octet-stream';
}

module.exports = router;

