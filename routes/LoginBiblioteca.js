const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mediaPool = require('../mediaDb');

const router = express.Router();

// POST /api/login
router.post('/login', async (req, res) => {
  const { email, password, contrasena } = req.body;
  const plainPassword = password || contrasena;

  if (!email || !plainPassword) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  try {
    const { rows } = await mediaPool.query(
      'SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(plainPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;
