const { Client } = require('pg');

async function checkDb() {
  const client = new Client({
    connectionString: "postgresql://postgres:[Bucefalo.123]@db.mapwtjdfqcdlsqutckjd.supabase.co:5432/postgres"
  });

  try {
    await client.connect();
    console.log("Connected to database successfully!");
    
    // Check auth.users
    const authRes = await client.query("SELECT id, email FROM auth.users WHERE email = 'admin@prueba.com'");
    console.log("Auth users:", authRes.rows);

    // Check public.usuarios
    const pubRes = await client.query("SELECT id, email, rol, empresa_id FROM public.usuarios WHERE email = 'admin@prueba.com'");
    console.log("Public usuarios:", pubRes.rows);

    // Check RLS policies on public.usuarios
    const rlsRes = await client.query("SELECT tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'usuarios'");
    console.log("RLS Policies on usuarios:", rlsRes.rows);

    await client.end();
  } catch (err) {
    console.error("Connection error", err.stack);
  }
}

checkDb();
