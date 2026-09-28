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

    if (direction === 'down') {
      files.reverse();
    }

    for (const file of files) {
      console.log(`Executing migration: ${file} [${direction}]`);
      const migration = require(path.join(migrationsDir, file));
      if (typeof migration[direction] === 'function') {
        await migration[direction](queryInterface, sequelize.constructor);
      }
    }

    console.log('All migrations executed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

const direction = process.argv[2] === 'down' ? 'down' : 'up';
runMigrations(direction);
