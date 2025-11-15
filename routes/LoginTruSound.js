const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const musicPool = require('../musicDb');

const router = express.Router();

router.post('/trusound/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  try {
    const { rows } = await musicPool.query(
      'SELECT id, email, password_hash, role, created_at FROM users_music WHERE email = $1 LIMIT 1',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, source: 'trusound' },
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
    console.error('Error during TruSound login:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;

