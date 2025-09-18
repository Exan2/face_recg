require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'exan',
    password: process.env.DB_PASSWORD || 'exan',
    database: process.env.DB_NAME || 'face_rec',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
};
