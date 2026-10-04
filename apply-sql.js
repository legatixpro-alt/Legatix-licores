const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (!dbUrlMatch) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }
  const dbUrl = dbUrlMatch[1];
  
  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    const sqlContent = fs.readFileSync(path.join(__dirname, 'LIMPIAR_BD.sql'), 'utf-8');
    
    await client.query(sqlContent);
    console.log('SQL executed successfully.');
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    await client.end();
  }
}

run();
