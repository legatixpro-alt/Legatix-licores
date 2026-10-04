import pg from 'pg'
import fs from 'fs'
import path from 'path'

const { Client } = pg

const connectionString = "postgresql://postgres:[Bucefalo.123]@db.mapwtjdfqcdlsqutckjd.supabase.co:5432/postgres"

async function run() {
  const client = new Client({ connectionString })
  
  try {
    await client.connect()
    console.log("Conectado a la base de datos.")

    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
    const files = fs.readdirSync(migrationsDir).sort()

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Ejecutando migración: ${file}`)
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
        try {
          await client.query(sql)
          console.log(`✅ ${file} ejecutado con éxito.`)
        } catch (e) {
          console.error(`⚠️ Error en ${file}:`, e.message)
          // Ignorar errores porque algunas tablas o funciones ya podrían existir
        }
      }
    }

    console.log("\nVerificando usuario admin@prueba.com...")
    
    // Buscar usuario en auth.users
    const userRes = await client.query(`SELECT id, email FROM auth.users WHERE email = 'admin@prueba.com' LIMIT 1`)
    if (userRes.rows.length === 0) {
      console.log("El usuario admin@prueba.com no existe en auth.users. Asegúrate de registrarlo en el login primero.")
      process.exit(0)
    }
    
    const userId = userRes.rows[0].id
    console.log(`Usuario encontrado: ${userId}`)

    // Verificar si ya tiene empresa
    const usuarioRes = await client.query(`SELECT * FROM public.usuarios WHERE id = $1`, [userId])
    
    if (usuarioRes.rows.length === 0) {
      console.log("El usuario no está en la tabla pública. Creando empresa y perfil...")
      
      // Insertar empresa
      const empresaRes = await client.query(`
        INSERT INTO public.empresas (nombre, rif, moneda_principal)
        VALUES ('Mi Empresa', 'J-00000000-0', 'USD')
        RETURNING id
      `)
      const empresaId = empresaRes.rows[0].id

      // Insertar usuario
      await client.query(`
        INSERT INTO public.usuarios (id, empresa_id, rol)
        VALUES ($1, $2, 'admin')
      `, [userId, empresaId])

      console.log(`✅ Empresa (${empresaId}) y Usuario creados correctamente.`)
    } else {
      console.log("El usuario ya existe en la tabla pública.")
      if (!usuarioRes.rows[0].empresa_id) {
         // Insertar empresa
        const empresaRes = await client.query(`
          INSERT INTO public.empresas (nombre, rif, moneda_principal)
          VALUES ('Mi Empresa', 'J-00000000-0', 'USD')
          RETURNING id
        `)
        const empresaId = empresaRes.rows[0].id
        await client.query(`UPDATE public.usuarios SET empresa_id = $1 WHERE id = $2`, [empresaId, userId])
        console.log(`✅ Empresa (${empresaId}) asignada al usuario.`)
      }
    }

    console.log("\nTodo listo. Ya puedes recargar el Dashboard.")

  } catch (err) {
    console.error("Error general:", err)
  } finally {
    await client.end()
  }
}

run()
