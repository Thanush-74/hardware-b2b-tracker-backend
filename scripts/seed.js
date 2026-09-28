const path = require('path');
const fs = require('fs');
const { sequelize } = require('../config/database');

const runSeeders = async (direction = 'up') => {
  try {
    await sequelize.authenticate();
    console.log('Database connected. Running seeders (' + direction + ')...');

    const queryInterface = sequelize.getQueryInterface();
    const seedersDir = path.join(__dirname, '..', 'seeders');
    const files = fs.readdirSync(seedersDir).filter(f => f.endsWith('.js')).sort();

    if (direction === 'down') {
      files.reverse();
    }

    for (const file of files) {
      console.log(`Executing seeder: ${file} [${direction}]`);
      const seeder = require(path.join(seedersDir, file));
      if (typeof seeder[direction] === 'function') {
        await seeder[direction](queryInterface, sequelize.constructor);
      }
    }

    console.log('All seeders executed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

const direction = process.argv[2] === 'down' ? 'down' : 'up';
runSeeders(direction);
