const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const mediaPool = new Pool({
  host: process.env.MEDIA_PG_HOST,
  port: process.env.MEDIA_PG_PORT ? Number(process.env.MEDIA_PG_PORT) : undefined,
  database: process.env.MEDIA_PG_DATABASE,
  user: process.env.MEDIA_PG_USER,
  password: process.env.MEDIA_PG_PASSWORD || undefined
});

mediaPool.on('error', (err) => {
  console.error('Unexpected error on media DB client', err);
  process.exit(-1);
});

module.exports = mediaPool;

