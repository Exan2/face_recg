const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const Employee = require('./Employee')(sequelize);
const ScanHistory = require('./ScanHistory')(sequelize);

// Define associations
Employee.hasMany(ScanHistory, { 
  foreignKey: 'employeeId', 
  as: 'scanHistory' 
});
ScanHistory.belongsTo(Employee, { 
  foreignKey: 'employeeId', 
  as: 'employee' 
});

const db = {
  sequelize,
  Sequelize,
  Employee,
  ScanHistory
};

module.exports = db;
