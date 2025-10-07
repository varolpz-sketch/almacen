const pg = require('pg');
const { Pool } = pg;
const dotenv = require('dotenv');
dotenv.config();

let local_pool_config = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool_config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        require: true,         
        rejectUnauthorized: false 
      }
    }
  : local_pool_config;

const pool = new Pool(pool_config);

module.exports = {
  pool
}