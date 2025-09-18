'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert demo employees
    await queryInterface.bulkInsert('employees', [
      {
        employee_id: 'EMP001',
        name: 'John Doe',
        specialty: 'Software Engineer',
        city: 'New York',
        birth_date: '1990-05-15',
        face_encoding: null,
        image_path: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        employee_id: 'EMP002',
        name: 'Jane Smith',
        specialty: 'Data Analyst',
        city: 'Los Angeles',
        birth_date: '1988-12-03',
        face_encoding: null,
        image_path: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        employee_id: 'EMP003',
        name: 'Mike Johnson',
        specialty: 'Project Manager',
        city: 'Chicago',
        birth_date: '1985-08-22',
        face_encoding: null,
        image_path: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('employees', null, {});
  }
};
