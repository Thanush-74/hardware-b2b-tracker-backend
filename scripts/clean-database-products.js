const {
  Product,
  Inventory,
  CartItem,
  OrderItem,
  Production,
  ManufacturingAssignment,
  Inspection,
  Return,
  sequelize
} = require('../models');

const cleanDatabase = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log('--- Cleaning DB to keep ONLY GPU, RAM, ROM/SSD, Motherboard ---');

    // Canonical definitions with specifications
    const canonicalDefs = [
      {
        name: 'GPU',
        type: 'GPU',
        specifications: { vram: '16GB GDDR6X', architecture: 'RTX 4080', interface: 'PCIe 4.0' },
        price: 950.00,
        available_quantity: 38,
        description: 'Graphics Processing Unit designed for high-performance rendering and parallel computing.',
        is_active: true
      },
      {
        name: 'RAM',
        type: 'RAM',
        specifications: { capacity: '16GB', speed: '3200MHz', generation: 'DDR4' },
        price: 49.99,
        available_quantity: 180,
        description: 'High-speed DDR4 desktop memory module with aluminum heat spreader.',
        is_active: true
      },
      {
        name: 'ROM / SSD',
        type: 'ROM / SSD',
        specifications: { capacity: '1TB', form_factor: 'M.2 NVMe', read_speed: '7000MB/s' },
        price: 89.50,
        available_quantity: 80,
        description: 'High-speed NVMe M.2 Solid State Drive for enterprise and workstation storage.',
        is_active: true
      },
      {
        name: 'Motherboard',
        type: 'Motherboard',
        specifications: { chipset: 'Intel Z790', form_factor: 'ATX', socket: 'LGA1700' },
        price: 210.00,
        available_quantity: 30,
        description: 'ATX motherboard with multi-layer PCB, reinforced PCIe slots, and VRM heatsinks.',
        is_active: true
      }
    ];

    const allProducts = await Product.findAll({ transaction });
    console.log(`Found ${allProducts.length} products currently in DB.`);

    const getCanonicalType = (p) => {
      const name = (p.name || '').toUpperCase();
      const type = (p.type || '').toUpperCase();
      if (type.includes('GPU') || name.includes('GPU') || name.includes('GRAPHICS')) return 'GPU';
      if (type.includes('RAM') || name.includes('RAM') || name.includes('DDR')) return 'RAM';
      if (type.includes('ROM') || type.includes('SSD') || name.includes('SSD') || name.includes('NVME') || type.includes('STORAGE')) {
        if (name.includes('KEYBOARD')) return null;
        return 'ROM / SSD';
      }
      if (type.includes('MOTHERBOARD') || name.includes('MOTHERBOARD') || name.includes('MAINBOARD')) return 'Motherboard';
      return null;
    };

    const canonicalProducts = {};

    for (const def of canonicalDefs) {
      let prod = allProducts.find(p => p.name === def.name && p.type === def.type);
      if (!prod) {
        prod = allProducts.find(p => getCanonicalType(p) === def.type);
      }

      if (prod) {
        await prod.update({
          name: def.name,
          type: def.type,
          specifications: def.specifications,
          price: def.price,
          available_quantity: def.available_quantity,
          description: def.description,
          is_active: true
        }, { transaction });
        canonicalProducts[def.type] = prod;
        console.log(`✓ Reused existing product #${prod.id} for canonical ${def.name}`);
      } else {
        prod = await Product.create(def, { transaction });
        canonicalProducts[def.type] = prod;
        console.log(`+ Created canonical product #${prod.id} for ${def.name}`);
      }
    }

    const canonicalIds = Object.values(canonicalProducts).map(p => p.id);
    console.log('Canonical Product IDs to keep:', canonicalIds);

    // Re-link associations from deleted products to canonical products
    for (const p of allProducts) {
      if (canonicalIds.includes(p.id)) continue;

      const targetType = getCanonicalType(p) || 'RAM';
      const targetCanonical = canonicalProducts[targetType];

      console.log(`Re-linking associations from obsolete Product #${p.id} (${p.name}) to Canonical #${targetCanonical.id} (${targetCanonical.name})...`);

      if (OrderItem) {
        await OrderItem.update({ product_id: targetCanonical.id }, { where: { product_id: p.id }, transaction });
      }
      if (CartItem) {
        await CartItem.update({ product_id: targetCanonical.id }, { where: { product_id: p.id }, transaction });
      }
      if (Production) {
        await Production.update({ product_id: targetCanonical.id }, { where: { product_id: p.id }, transaction });
      }
      if (ManufacturingAssignment) {
        await ManufacturingAssignment.update({ product_id: targetCanonical.id }, { where: { product_id: p.id }, transaction });
      }
      if (Inspection) {
        await Inspection.update({ product_id: targetCanonical.id }, { where: { product_id: p.id }, transaction });
      }
      if (Return) {
        await Return.update({ product_id: targetCanonical.id }, { where: { product_id: p.id }, transaction });
        await Return.update({ replacement_product_id: targetCanonical.id }, { where: { replacement_product_id: p.id }, transaction });
      }

      await Inventory.destroy({ where: { product_id: p.id }, transaction });
      await p.destroy({ transaction });
      console.log(`- Deleted obsolete product #${p.id} (${p.name})`);
    }

    // Ensure inventory records exist and match exactly for the 4 canonical products
    for (const def of canonicalDefs) {
      const prod = canonicalProducts[def.type];
      let inv = await Inventory.findOne({ where: { product_id: prod.id }, transaction });
      if (inv) {
        await inv.update({
          quantity: def.available_quantity,
          reserved_quantity: 0,
          location: 'Main Warehouse'
        }, { transaction });
      } else {
        await Inventory.create({
          product_id: prod.id,
          quantity: def.available_quantity,
          reserved_quantity: 0,
          location: 'Main Warehouse'
        }, { transaction });
      }
    }

    await transaction.commit();
    console.log('\n✅ Successfully cleaned DB! Only the 4 canonical products (GPU, RAM, ROM/SSD, Motherboard) remain in database.');
  } catch (err) {
    await transaction.rollback();
    console.error('Error cleaning database:', err);
    process.exit(1);
  }
};

cleanDatabase().then(() => process.exit(0));
