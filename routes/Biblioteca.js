//routes/Biblioteca.js
const express = require('express');
const router = express.Router();
const Movie = require('../models/Biblioteca');

// GET /api/movies - Obtener todas las películas
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

