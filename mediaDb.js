const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const mediaPool = new Pool({
  host: process.env.MEDIA_PG_HOST || process.env.PG_HOST || '/var/run/postgresql',
  port: process.env.MEDIA_PG_PORT
    ? Number(process.env.MEDIA_PG_PORT)
    : (process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432),
  database: process.env.MEDIA_PG_DATABASE || 'media_server',
  user: process.env.MEDIA_PG_USER || process.env.PG_USER || 'postgres',
  password:
    process.env.MEDIA_PG_PASSWORD !== undefined
      ? process.env.MEDIA_PG_PASSWORD
      : process.env.PG_PASSWORD
});

mediaPool.on('error', (err) => {
  console.error('Unexpected error on media DB client', err);
  process.exit(-1);
});

module.exports = mediaPool;

