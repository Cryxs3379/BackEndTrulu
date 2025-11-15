const express = require('express');
const dotenv = require('dotenv');
const tetrisRoutes = require('./tetrisRoutes');
const bibliotecaRoutes = require('./routes/Biblioteca');
const loginBibliotecaRoutes = require('./routes/LoginBiblioteca');
const truSoundCloudRoutes = require('./routes/TruSoundCloud');
const loginTruSoundRoutes = require('./routes/LoginTruSound');

dotenv.config();

const app = express();

app.use(express.json());

app.use(tetrisRoutes);
app.use('/api/biblioteca', bibliotecaRoutes);
app.use('/api', loginBibliotecaRoutes);
app.use('/api', loginTruSoundRoutes);
app.use('/api/TruSoundCloud', truSoundCloudRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
