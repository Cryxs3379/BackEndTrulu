// supabaseRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// 🔹 GET /api/supabase/coches
router.get('/coches', async (req, res) => {
  const { data, error } = await supabase.from('coches').select('*'); // ✅ minúscula
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 🔹 GET /api/supabase/clientes
router.get('/clientes', async (req, res) => {
  const { data, error } = await supabase.from('clientes').select('*'); // ✅ minúscula
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 🔹 GET /api/supabase/reservas
router.get('/reservas', async (req, res) => {
  const { data, error } = await supabase.from('reservas').select('*'); // ✅ minúscula
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 🔹 GET /api/supabase/tetris
router.get('/tetris', async (req, res) => {
  const { data, error } = await supabase.from('tetris').select('*'); // ✅ minúscula
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
module.exports = router;

// 🔹 POST /api/supabase/reservas
router.post('/reservas', async (req, res) => {
  const nuevaReserva = req.body;
  console.log('📥 Reserva recibida:', nuevaReserva);

  const { data, error } = await supabase
    .from('reservas')
    .insert([nuevaReserva])
    .select()  // 🔧 Esto asegura que se devuelva la fila insertada

  if (error) {
    console.error('❌ Error al insertar reserva:', error);
    return res.status(500).json({ error: error.message });
  }

  console.log('✅ Reserva insertada:', data[0]);
  res.status(201).json(data[0]); 
});

//---------------------------------------------------------------------------

router.post('/confirmar-cliente', async (req, res) => {
  const cliente = req.body;
  console.log('🧾 Cliente recibido en backend:', cliente);

  if (!cliente || !cliente.id) {
    return res.status(400).json({ error: 'Faltan datos del cliente o el ID de la reserva' });
  }

  const { id, ...clienteSinId } = cliente;

  // 1. Insertar en tabla clientes
  const { data: clienteInsertado, error: errorInsertar } = await supabase
    .from('clientes')
    .insert([clienteSinId])
    .select();

  if (errorInsertar) {
    console.error('❌ Error al insertar cliente:', errorInsertar);
    return res.status(500).json({ error: errorInsertar.message });
  }

  // 2. Actualizar disponibilidad del coche
  if (cliente.idcoche) {
    const cocheId = Number(cliente.idcoche); // ✅ Conversión segura
    console.log(`➡️ Intentando marcar coche ${cocheId} como no disponible`);

    const { error: errorUpdateCoche } = await supabase
      .from('coches')
      .update({ disponible: 'no' }) // 👈 tipo texto
      .eq('id', cocheId);

    if (errorUpdateCoche) {
      console.error('❌ Error al actualizar coche:', errorUpdateCoche);
      return res.status(500).json({ error: errorUpdateCoche.message });
    }

    console.log(`✅ Coche con ID ${cocheId} marcado como NO disponible`);
  }

  // 3. Eliminar reserva original
  const { error: errorBorrar } = await supabase
    .from('reservas')
    .delete()
    .eq('id', id);

  if (errorBorrar) {
    console.error('❌ Error al borrar reserva:', errorBorrar);
    return res.status(500).json({ error: errorBorrar.message });
  }

  res.status(201).json(clienteInsertado[0]);
});


// 🔹 POST /api/supabase/tetris
router.post('/tetris', async (req, res) => {
  const nuevaEntrada = req.body;
  console.log('📥 Puntuación recibida:', nuevaEntrada);

  const { data, error } = await supabase
    .from('tetris')
    .insert([nuevaEntrada])
    .select();

  if (error) {
    console.error('❌ Error al guardar puntuación:', error);
    return res.status(500).json({ error: error.message });
  }

  console.log('✅ Puntuación guardada:', data[0]);
  res.status(201).json(data[0]);
});

// 🔹 DELETE /api/supabase/eliminar-cliente/:id
router.delete('/eliminar-cliente/:id', async (req, res) => {
  const clienteId = req.params.id;
  const cocheId = req.query.idcoche;

  // 1. Eliminar cliente
  const { error: errorDelete } = await supabase
    .from('clientes')
    .delete()
    .eq('id', clienteId);

  if (errorDelete) {
    console.error('❌ Error al eliminar cliente:', errorDelete);
    return res.status(500).json({ error: errorDelete.message });
  }

  // 2. Marcar coche como disponible de nuevo
  if (cocheId) {
    const { error: errorUpdate } = await supabase
      .from('coches')
      .update({ disponible: 'si' })
      .eq('id', cocheId);

    if (errorUpdate) {
      console.error('❌ Error al actualizar coche:', errorUpdate);
      return res.status(500).json({ error: errorUpdate.message });
    }
  }

  res.status(200).json({ message: 'Cliente eliminado y coche marcado como disponible' });
});
