## Configuración del backend Tetris

### Variables de entorno (`.env`)
```
PG_HOST=/var/run/postgresql
PG_PORT=5432
PG_DATABASE=tetris_db
PG_USER=postgres
PG_PASSWORD=
```

### Cliente PostgreSQL (`db.js`)
```js
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : undefined,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
```

### Rutas Tetris (`tetrisRoutes.js`)
```js
const express = require('express');
const pool = require('./db');

const router = express.Router();

router.post('/api/score', async (req, res) => {
  const { username, score } = req.body;

  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'username y score son obligatorios' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tetris (username, score) VALUES ($1, $2) RETURNING *',
      [username, score]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error guardando puntuación:', error);
    res.status(500).json({ error: 'No se pudo guardar la puntuación' });
  }
});

router.get('/api/leaderboard', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, score, created_at FROM tetris ORDER BY score DESC, created_at ASC LIMIT 10'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    res.status(500).json({ error: 'No se pudo obtener el leaderboard' });
  }
});

module.exports = router;
```

### Servidor (`server.js`)
```js
const express = require('express');
const dotenv = require('dotenv');
const tetrisRoutes = require('./tetrisRoutes');

dotenv.config();

const app = express();

app.use(express.json());
app.use(tetrisRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Tetris escuchando en http://localhost:${PORT}`);
});
```

### Esquema PostgreSQL (referencia)
```sql
CREATE TABLE tetris (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

