require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Staff, Role, Permission } = require('../models');

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // 1. Find or verify Admin role
    let [adminRole] = await Role.findOrCreate({
      where: { slug: 'admin' },
      defaults: {
        slug: 'admin',
        name: 'Admin',
        description: 'Administrator with full system access'
      }
    });

    // 2. Fetch all permissions and assign to Admin role
    const permissions = await Permission.findAll();
    if (permissions && permissions.length > 0) {
      await adminRole.setPermissions(permissions);
      console.log(`Assigned ${permissions.length} permissions to Admin role.`);
    }

    // 3. Prepare admin credentials
    const email = (process.env.INITIAL_ADMIN_EMAIL || 'admin@company.com').trim().toLowerCase();
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'password';
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create or update the admin staff user
    const [adminUser, created] = await Staff.findOrCreate({
      where: { email },
      defaults: {
        first_name: 'Admin',
        last_name: 'User',
        email,
        password_hash: passwordHash,
        role_id: adminRole.id,
        is_active: true
      }
    });

    if (!created) {
      adminUser.password_hash = passwordHash;
      adminUser.role_id = adminRole.id;
      adminUser.is_active = true;
      await adminUser.save();
      console.log(`Updated existing admin user: ${email} with password: "${password}".`);
    } else {
      console.log(`Created new admin user: ${email} with password: "${password}".`);
    }

    console.log('\nAdmin credentials ready:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
}

seedAdmin();
