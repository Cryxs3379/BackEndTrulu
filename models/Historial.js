const mongoose = require('mongoose');

const historialSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsuarioCalendario',
    required: true
  },
  nombre: String,
  apellido: String,
  accion: {
    type: String,
    required: true
  },
  eventoTitulo: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Historial', historialSchema, 'HistorialEventos');
