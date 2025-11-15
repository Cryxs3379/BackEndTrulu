const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const musicPool = new Pool({
  host: process.env.MUSIC_PG_HOST || process.env.PG_HOST || '/var/run/postgresql',
  port: process.env.MUSIC_PG_PORT
    ? Number(process.env.MUSIC_PG_PORT)
    : (process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432),
  database: process.env.MUSIC_PG_DATABASE || 'music_server',
  user: process.env.MUSIC_PG_USER || process.env.PG_USER || 'postgres',
  password:
    process.env.MUSIC_PG_PASSWORD !== undefined
      ? process.env.MUSIC_PG_PASSWORD
      : process.env.PG_PASSWORD
});

musicPool.on('error', (err) => {
  console.error('Unexpected error on TruSoundCloud DB client', err);
  process.exit(-1);
});

module.exports = musicPool;

