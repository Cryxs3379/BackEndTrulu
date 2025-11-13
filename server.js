const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const movieRoutes = require('./routes/Biblioteca');
const loginRoutes = require('./routes/LoginBiblioteca');
const loginCalendarioRoutes = require('./routes/LoginCalendario');
const CalendarioRoutes = require('./routes/Calendario');
const historialRoutes = require('./routes/Historial');
const supabaseRoutes = require('./supabase/routes/supabaseRoutes');

dotenv.config();

const app = express();

// 👇 AQUI CAMBIADO
app.use(cors({
  origin: [
    'http://localhost:5173', // para desarrollo local
    'https://trujillolucenaapp.vercel.app' // para producción en Vercel (nuevo dominio)
  ],
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error de conexión:', err));

app.use('/api/biblioteca', movieRoutes);
app.use('/api', loginRoutes);
app.use('/api/logincalendario', loginCalendarioRoutes);
app.use('/api/calendario', CalendarioRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/supabase', supabaseRoutes);


const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
