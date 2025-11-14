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
