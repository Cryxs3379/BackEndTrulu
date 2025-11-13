//LoginCalendario
const mongoose = require('mongoose');

const usuarioCalendarioSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  nombre: String,
  apellido: String,
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UsuarioCalendario', usuarioCalendarioSchema,'Usuarios');
