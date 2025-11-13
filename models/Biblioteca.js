//Biblioteca.js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  nombre: String,
  imagen: String,
  sinopsis: String,
  fecha_creacion: Date,
  ver_legalmente: [String],
  ver_menos_legalmente: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Biblioteca', movieSchema, 'biblioteca');
