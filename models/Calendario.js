const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UsuarioCalendario' },
  createdByEmail: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('EventoCalendario', eventoSchema, 'EventosCalendario');
