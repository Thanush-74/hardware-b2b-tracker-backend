const path = require('path');
const fs = require('fs');
const { sequelize } = require('../config/database');

const runMigrations = async (direction = 'up') => {
  try {
    await sequelize.authenticate();
    console.log('Database connected. Running migrations (' + direction + ')...');

    const queryInterface = sequelize.getQueryInterface();
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js')).sort();

    // Ensure SequelizeMeta tracking table exists
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

    const executedRows = await queryInterface.sequelize.query(
      'SELECT name FROM "SequelizeMeta";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const executedSet = new Set(executedRows.map(r => r.name));

    if (direction === 'up') {
      const pendingFiles = files.filter(f => !executedSet.has(f));
      if (pendingFiles.length === 0) {
        console.log('No pending migrations to execute. Database schema is up to date.');
        process.exit(0);
      }

      for (const file of pendingFiles) {
        console.log(`Executing migration: ${file} [up]`);
        const migration = require(path.join(migrationsDir, file));
        if (typeof migration.up === 'function') {
          await migration.up(queryInterface, sequelize.constructor);
        }
        await queryInterface.bulkInsert('SequelizeMeta', [{ name: file }]);
      }
    } else if (direction === 'down') {
      const executedFiles = files.filter(f => executedSet.has(f)).reverse();
      if (executedFiles.length === 0) {
        console.log('No executed migrations to revert.');
        process.exit(0);
      }

      // Revert the last executed migration
      const fileToRevert = executedFiles[0];
      console.log(`Reverting migration: ${fileToRevert} [down]`);
      const migration = require(path.join(migrationsDir, fileToRevert));
      if (typeof migration.down === 'function') {
        await migration.down(queryInterface, sequelize.constructor);
      }
      await queryInterface.bulkDelete('SequelizeMeta', { name: fileToRevert });
    }

    console.log('Migration operation completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

const direction = process.argv[2] === 'down' ? 'down' : 'up';
runMigrations(direction);
