'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scan_history', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      scan_type: {
        type: Sequelize.ENUM('success', 'failed', 'unknown'),
        allowNull: false
      },
      confidence: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      image_path: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      scanned_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('scan_history', ['employee_id'], {
      name: 'scan_history_employee_id_index'
    });

    await queryInterface.addIndex('scan_history', ['scan_type'], {
      name: 'scan_history_scan_type_index'
    });

    await queryInterface.addIndex('scan_history', ['scanned_at'], {
      name: 'scan_history_scanned_at_index'
    });

    await queryInterface.addIndex('scan_history', ['ip_address'], {
      name: 'scan_history_ip_address_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('scan_history');
  }
};
