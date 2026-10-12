'use strict';

/**
 * Seed the four canonical initial products (GPU, RAM, ROM/SSD, Motherboard)
 * and their matching inventory records.
 *
 * SAFE / IDEMPOTENT: checks by (name + type) before inserting.
 * Running this seeder multiple times will NOT create duplicates.
 */

// Canonical product definitions — these are the four initial categories
const INITIAL_PRODUCTS = [
  {
    name: 'GPU',
    type: 'GPU',
    specifications: JSON.stringify({ vram: '16GB GDDR6X', architecture: 'RTX 4080', interface: 'PCIe 4.0' }),
    price: 950.00,
    available_quantity: 0,
    description: 'Graphics Processing Unit designed for high-performance rendering and parallel computing.',
    is_active: true
  },
  {
    name: 'RAM',
    type: 'RAM',
    specifications: JSON.stringify({ capacity: '16GB', speed: '3200MHz', generation: 'DDR4' }),
    price: 49.99,
    available_quantity: 0,
    description: 'High-speed DDR4 desktop memory module with aluminum heat spreader.',
    is_active: true
  },
  {
    name: 'ROM',
    type: 'ROM',
    specifications: JSON.stringify({ capacity: '1TB', form_factor: 'M.2 NVMe', read_speed: '7000MB/s' }),
    price: 89.50,
    available_quantity: 0,
    description: 'High-speed Read-Only Memory / NVMe Solid State Drive for enterprise and workstation storage.',
    is_active: true
  },
  {
    name: 'Motherboard',
    type: 'Motherboard',
    specifications: JSON.stringify({ chipset: 'Intel Z790', form_factor: 'ATX', socket: 'LGA1700' }),
    price: 210.00,
    available_quantity: 0,
    description: 'ATX motherboard with multi-layer PCB, reinforced PCIe slots, and VRM heatsinks.',
    is_active: true
  }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    for (const prod of INITIAL_PRODUCTS) {
      // Check whether a product with this exact name AND type already exists
      const existingId = await queryInterface.rawSelect('products', {
        where: { name: prod.name, type: prod.type }
      }, ['id']);

      if (existingId) {
        console.log(`  ⏭  Skipping "${prod.name}" (${prod.type}) — already exists (id=${existingId})`);
        continue;
      }

      // Insert the product
      await queryInterface.bulkInsert('products', [{
        name: prod.name,
        type: prod.type,
        specifications: prod.specifications,
        price: prod.price,
        available_quantity: prod.available_quantity,
        description: prod.description,
        is_active: prod.is_active,
        created_at: now,
        updated_at: now
      }]);

      // Retrieve the newly inserted product's id so we can create the inventory row
      const newId = await queryInterface.rawSelect('products', {
        where: { name: prod.name, type: prod.type }
      }, ['id']);

      if (!newId) continue;

      // Check whether an inventory record already exists for this product
      const existingInv = await queryInterface.rawSelect('inventory', {
        where: { product_id: newId }
      }, ['id']);

      if (!existingInv) {
        await queryInterface.bulkInsert('inventory', [{
          product_id: newId,
          quantity: 0,
          reserved_quantity: 0,
          location: 'Main Warehouse',
          created_at: now,
          updated_at: now
        }]);
        console.log(`  ✓  Inserted "${prod.name}" (${prod.type}) → id=${newId}, inventory created`);
      } else {
        console.log(`  ✓  Inserted "${prod.name}" (${prod.type}) → id=${newId} (inventory already existed)`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Only remove products that were created by this seeder (matched by name + type)
    for (const prod of INITIAL_PRODUCTS) {
      const id = await queryInterface.rawSelect('products', {
        where: { name: prod.name, type: prod.type }
      }, ['id']);

      if (id) {
        await queryInterface.bulkDelete('inventory', { product_id: id }, {});
        await queryInterface.bulkDelete('products', { id }, {});
        console.log(`  ✓  Removed "${prod.name}" (id=${id}) and its inventory`);
      }
    }
  }
};
