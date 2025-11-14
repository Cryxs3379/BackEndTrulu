const express = require('express');
const pool = require('./db');

const router = express.Router();

router.post('/api/score', async (req, res) => {
  const { username, score } = req.body;

  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'username y score son obligatorios' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tetris (username, score) VALUES ($1, $2) RETURNING *',
      [username, score]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error guardando puntuación:', error);
    res.status(500).json({ error: 'No se pudo guardar la puntuación' });
  }
});

router.get('/api/leaderboard', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, score, created_at FROM tetris ORDER BY score DESC, created_at ASC LIMIT 10'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    res.status(500).json({ error: 'No se pudo obtener el leaderboard' });
  }
});

module.exports = router;

