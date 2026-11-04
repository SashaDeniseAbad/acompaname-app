import { authenticate, ensureProfileRow, json } from '../lib/supabase-admin.mjs';

// GET: devuelve las últimas 50 gestiones del usuario, de la más nueva a la más vieja.
// POST: guarda una gestión nueva.
// Los nombres de los campos que viajan al front son los mismos que usa SavedTask en src/types/index.ts.

const tipos = ['event', 'cinema', 'appointment', 'other'];

const toFront = (row) => ({ id: row.id, kind: row.tipo, title: row.titulo, description: row.descripcion, createdAt: row.creado_en, mode: row.modo });

export const handler = async (event) => {
  try {
    const auth = await authenticate(event);
    if (auth.error) return auth.error;
    const { db, user } = auth;

    if (event.httpMethod === 'GET') {
      const { data, error } = await db.from('gestiones').select('*').eq('usuario_id', user.id).order('creado_en', { ascending: false }).limit(50);
      if (error) throw error;
      return json(200, { tasks: data.map(toFront) });
    }

    if (event.httpMethod === 'POST') {
      const task = JSON.parse(event.body || '{}');
      if (!tipos.includes(task.kind) || !task.title) return json(400, { error: 'La gestión no tiene un formato válido.' });
      await ensureProfileRow(db, user.id);
      // Se usa el mismo id que generó el front, así la copia local y la de la base son la misma gestión.
      // Si la gestión ya estaba guardada, no se duplica.
      const { error } = await db.from('gestiones').upsert({
        id: task.id,
        usuario_id: user.id,
        tipo: task.kind,
        titulo: String(task.title),
        descripcion: String(task.description || ''),
        modo: task.mode === 'real' ? 'real' : 'demo',
        creado_en: task.createdAt || new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
      return json(201, { ok: true });
    }

    return json(405, { error: 'Método no permitido.' });
  } catch (error) {
    console.error('gestiones', error);
    return json(500, { error: 'No pudimos guardar o leer tus gestiones en este momento.' });
  }
};
