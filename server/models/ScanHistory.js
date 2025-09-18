const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScanHistory = sequelize.define('ScanHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      },
      field: 'employee_id'
    },
    scanType: {
      type: DataTypes.ENUM('success', 'failed', 'unknown'),
      allowNull: false,
      field: 'scan_type'
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    imagePath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'image_path'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    scannedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'scanned_at'
    }
  }, {
    tableName: 'scan_history',
    timestamps: false,
    underscored: true
  });

  return ScanHistory;
};
