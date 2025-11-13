const express = require('express');
const Historial = require('../models/Historial');
const router = express.Router();

// Crear entrada en el historial
router.post('/', async (req, res) => {
  try {
    const nuevaAccion = new Historial(req.body);
    const accionGuardada = await nuevaAccion.save();
    res.status(201).json(accionGuardada);
  } catch (error) {
    res.status(400).json({ message: 'Error al registrar acción', error });
  }
});

// Obtener historial completo
router.get('/', async (req, res) => {
  try {
    const historial = await Historial.find().sort({ fecha: -1 }); // Más reciente primero
    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial', error });
  }
});

module.exports = router;
