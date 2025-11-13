//routes/logincalendario
const express = require('express');
const jwt = require('jsonwebtoken');
const UsuarioCalendario = require('../models/LoginCalendario');
const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  const user = await UsuarioCalendario.findOne({ email });
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({
    token,
    user: {
      id: user._id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      role: user.role
    }
  });
});

module.exports = router;
