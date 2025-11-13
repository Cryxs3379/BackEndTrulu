const express = require('express');
const Calendario = require('../models/Calendario');
const router = express.Router();

// ✅ Obtener todos los eventos
router.get('/', async (req, res) => {
  try {
    const eventos = await Calendario.find();
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
});

// ✅ Crear un nuevo evento
router.post('/', async (req, res) => {
  try {
    const nuevoEvento = new Calendario(req.body);
    const eventoGuardado = await nuevoEvento.save();
    res.status(201).json(eventoGuardado);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear evento', error: err });
  }
});

// ✅ Actualizar un evento
router.put('/:id', async (req, res) => {
  try {
    const eventoActualizado = await Calendario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(eventoActualizado);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar evento', error: err });
  }
});

// ✅ Eliminar un evento
router.delete('/:id', async (req, res) => {
  try {
    await Calendario.findByIdAndDelete(req.params.id);
    res.json({ message: 'Evento eliminado correctamente' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar evento', error: err });
  }
});

module.exports = router;
