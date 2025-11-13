//routes/LoginBiblioteca.js
const express = require('express');
const router = express.Router();
const Usuario = require('../models/LoginBiblioteca');


// POST /api/login
router.post('/login', async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const user = await Usuario.findOne({ email, contrasena });
    if (!user) return res.status(401).json({ message: 'Credenciales incorrectas' });

    // Devolver el usuario sin la contraseña
    const { contrasena: _, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// PUT /api/usuarios/:id/like
router.put('/usuarios/:id/like', async (req, res) => {
    const { id } = req.params;
    const pelicula = req.body;
  
    if (!pelicula || !pelicula._id) {
      return res.status(400).json({ message: 'Película inválida' });
    }
  
    try {
      const user = await Usuario.findByIdAndUpdate(
        id,
        { $addToSet: { peliculaslike: pelicula } }, // guarda objeto completo
        { new: true }
      );
  
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.json(user);
    } catch (err) {
      console.error('❌ Error en backend:', err);
      res.status(500).json({ message: 'Error al actualizar el usuario' });
    }
  });
  // DELETE /api/usuarios/:id/like
router.delete('/usuarios/:id/like', async (req, res) => {
    const { id } = req.params;
    const peliculaId = req.body._id;
  
    try {
      const user = await Usuario.findById(id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  
      // Filtra las películas para quitar la que coincida por _id
      user.peliculaslike = user.peliculaslike.filter(p => p._id !== peliculaId);
      await user.save();
  
      res.json(user);
    } catch (err) {
      console.error('❌ Error al quitar like:', err);
      res.status(500).json({ message: 'Error al quitar de favoritos' });
    }
  });
  
  

module.exports = router;
