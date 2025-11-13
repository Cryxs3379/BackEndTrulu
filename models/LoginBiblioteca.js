//models/LoginBiblioteca
const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: String,
  apellidos: String,
  email: String,
  contrasena: String,
  fecha_creacion: Date,
  peliculaslike: [mongoose.Schema.Types.Mixed]
});

module.exports = mongoose.model('Usuario', usuarioSchema, 'usersbiblioteca');