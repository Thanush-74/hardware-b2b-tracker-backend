const bcrypt = require('bcryptjs');
const {
  sequelize,
  Role,
  Staff,
  Product,
  Inventory,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Delivery,
  Production,
  ManufacturingAssignment,
  Inspection,
  Return,
  Expense,
  Notification
} = require('../models');

async function seedRealisticData() {
  console.log('🚀 Starting realistic data seeding for Hardware B2B Tracker (TitanCore / Dexwox)...');
  await sequelize.authenticate();

  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('password123', salt);

  // 1. Roles & Staff
  console.log('👤 Ensuring realistic staff accounts...');
  const roles = await Role.findAll();
  const roleMap = {};
  roles.forEach((r) => {
    roleMap[r.name] = r.id;
  });

  const staffData = [
    {
      email: 'admin@company.com',
      first_name: 'Rohin',
      last_name: 'Kumar',
      role_id: roleMap['Admin'] || 1,
      password_hash: commonPasswordHash,
      is_active: true
    },
    {
      email: 'ramesh.store@titancore.in',
      first_name: 'Ramesh',
      last_name: 'Kannan',
      role_id: roleMap['Store Manager'] || 2,
      password_hash: commonPasswordHash,
      is_active: true
    },
    {
      email: 'murugan.logistics@titancore.in',
      first_name: 'Murugan',
      last_name: 'Velu',
      role_id: roleMap['Delivery'] || 3,
      password_hash: commonPasswordHash,
      is_active: true
    },
    {
      email: 'priya.sales@titancore.in',
      first_name: 'Priya',
      last_name: 'Sundaram',
      role_id: roleMap['Sales'] || 4,
      password_hash: commonPasswordHash,
      is_active: true
    },
    {
      email: 'anand.qc@titancore.in',
      first_name: 'Anand',
      last_name: 'Raj',
      role_id: roleMap['Store Manager'] || 2,
      password_hash: commonPasswordHash,
      is_active: true
    }
  ];

  const staffMap = {};
  for (const s of staffData) {
    let existing = await Staff.findOne({ where: { email: s.email } });
    if (!existing) {
      existing = await Staff.create(s);
    } else {
      await existing.update({
        first_name: s.first_name,
        last_name: s.last_name,
        role_id: s.role_id,
        is_active: true
      });
    }
    staffMap[s.email] = existing;
  }

  const adminUser = staffMap['admin@company.com'];
  const storeMgr = staffMap['ramesh.store@titancore.in'];
  const deliveryAgent = staffMap['murugan.logistics@titancore.in'];
  const salesRep = staffMap['priya.sales@titancore.in'];
  const qcInspector = staffMap['anand.qc@titancore.in'];

  // 2. Realistic Hardware Products
  console.log('🔧 Seeding realistic hardware products and inventory...');
  const productsData = [
    {
      id: 1,
      name: 'Samsung 990 Pro 2TB NVMe SSD',
      type: 'SSD Storage',
      specifications: { form_factor: 'M.2 2280', interface: 'PCIe Gen 4.0 x4', read_speed: '7450 MB/s', write_speed: '6900 MB/s' },
      price: 169.99,
      available_quantity: 65,
      description: 'Ultra-fast industrial grade NVMe SSD for rugged servers and workstations.',
      is_active: true
    },
    {
      name: 'TitanCore B760 Micro-ATX Industrial Motherboard',
      type: 'Motherboard',
      specifications: { socket: 'LGA1700', chipset: 'Intel B760', memory_slots: 4, max_ram: '128GB DDR5', pcie_gen: 'PCIe 5.0' },
      price: 185.00,
      available_quantity: 42,
      description: 'Ruggedized motherboard with conformal coating for factory automation and edge computing.',
      is_active: true
    },
    {
      name: 'Intel Core i7-14700K 20-Core Industrial Processor',
      type: 'CPU / Processing',
      specifications: { cores: 20, threads: 28, base_clock: '3.4 GHz', boost_clock: '5.6 GHz', tdp: '125W' },
      price: 389.50,
      available_quantity: 28,
      description: 'High-performance hybrid core processor optimized for multi-threaded industrial control units.',
      is_active: true
    },
    {
      name: 'Crucial 64GB DDR5 5600MHz ECC Server Memory Kit (2x32GB)',
      type: 'RAM / Memory',
      specifications: { capacity: '64GB', configuration: '2 x 32GB', speed: '5600 MT/s', ecc: true, latency: 'CL46' },
      price: 215.00,
      available_quantity: 50,
      description: 'Error-correcting code (ECC) memory for mission-critical robotics and continuous runtime.',
      is_active: true
    },
    {
      name: 'Mean Well 750W 80+ Gold Modular Industrial Power Supply',
      type: 'Power Supply',
      specifications: { wattage: 750, efficiency: '80 PLUS Gold', input_voltage: '100-240V AC', mtbf: '100,000 hrs' },
      price: 125.00,
      available_quantity: 80,
      description: 'Heavy duty din-rail mountable modular power supply with surge and short-circuit protection.',
      is_active: true
    },
    {
      name: 'High-Torque NEMA 23 Stepper Motor 2.8A 1.9Nm',
      type: 'Motors & Actuators',
      specifications: { holding_torque: '1.9 Nm', current: '2.8 A', step_angle: '1.8 deg', shaft_diameter: '6.35 mm' },
      price: 45.00,
      available_quantity: 120,
      description: 'Precision stepper motor for CNC milling, 3D printers, and Cartesian robotic arms.',
      is_active: true
    },
    {
      name: 'TitanCore Rugged CNC Aluminum 2U Chassis Enclosure',
      type: 'Enclosure / Chassis',
      specifications: { form_factor: '2U Rackmount', material: 'Anodized 6061-T6 Aluminum', drive_bays: '4 x 3.5in / 8 x 2.5in' },
      price: 149.00,
      available_quantity: 35,
      description: 'Heavy gauge aluminum rackmount server chassis with anti-vibration drive bays.',
      is_active: true
    },
    {
      name: 'Noctua NF-A14 Industrial PPC 3000 RPM 140mm Heavy Fan',
      type: 'Cooling & Thermal',
      specifications: { size: '140mm', max_rpm: 3000, airflow: '158.5 CFM', ip_rating: 'IP67 Dust & Water resistant' },
      price: 32.50,
      available_quantity: 110,
      description: 'IP67 waterproof and dustproof heavy duty industrial cooling fan for harsh environments.',
      is_active: true
    },
    {
      name: 'Omron 24V DC Optical Proximity Sensor E3Z-D61',
      type: 'Sensors & Automation',
      specifications: { sensing_distance: '100mm', output_type: 'NPN', operating_voltage: '12-24V DC', response_time: '1ms' },
      price: 28.00,
      available_quantity: 95,
      description: 'Photoelectric sensor for conveyor line detection and part counting systems.',
      is_active: true
    },
    {
      name: 'Stainless Steel M6x20mm Allen Hex Socket Bolts (Box of 200)',
      type: 'Fasteners & Hardware',
      specifications: { thread_size: 'M6', length: '20mm', material: 'SS 304 Marine Grade', count: 200 },
      price: 19.99,
      available_quantity: 240,
      description: 'Corrosion resistant stainless steel hex socket fasteners for machinery assembly.',
      is_active: true
    },
    {
      name: 'NVIDIA RTX 4070 Ti 12GB AI Edge Compute Accelerator',
      type: 'Graphics / Compute',
      specifications: { memory: '12GB GDDR6X', cuda_cores: 7680, tensor_cores: 240, interface: 'PCIe 4.0 x16' },
      price: 799.00,
      available_quantity: 18,
      description: 'Industrial GPU accelerator for real-time computer vision and automated defect detection.',
      is_active: true
    },
    {
      name: 'Intel I225-V Dual Port 2.5GbE PCIe Industrial NIC',
      type: 'Networking & I/O',
      specifications: { ports: 2, speed: '2.5 Gbps per port', bus_interface: 'PCIe 2.0 x1', controller: 'Intel I225-V' },
      price: 42.00,
      available_quantity: 75,
      description: 'Low-latency dual 2.5-gigabit Ethernet network interface card for factory PLC networks.',
      is_active: true
    }
  ];

  const productRecords = [];
  for (const p of productsData) {
    let existing;
    if (p.id) {
      existing = await Product.findByPk(p.id);
    }
    if (!existing) {
      existing = await Product.findOne({ where: { name: p.name } });
    }

    if (existing) {
      await existing.update(p);
      productRecords.push(existing);
    } else {
      const created = await Product.create(p);
      productRecords.push(created);
    }
  }

  // Inventory records for products
  const warehouseLocations = [
    'Warehouse A - Bay 12 (Central)',
    'Warehouse A - Rack 04 (Motherboards)',
    'Warehouse B - Bin 18 (Processors)',
    'Warehouse A - Rack 08 (Memory)',
    'Warehouse C - Bay 02 (Power Units)',
    'Assembly Line 1 - Staging Rack',
    'Warehouse C - Bay 05 (Chassis)',
    'Warehouse B - Rack 11 (Cooling)',
    'Warehouse A - Sensor Bin 3',
    'Fastener Locker 2 - Bin 06',
    'High-Value Vault - Rack 01',
    'Warehouse B - Rack 14 (Networking)'
  ];

  for (let i = 0; i < productRecords.length; i++) {
    const prod = productRecords[i];
    const loc = warehouseLocations[i % warehouseLocations.length];
    let inv = await Inventory.findOne({ where: { product_id: prod.id } });
    const reserved = Math.min(10, Math.floor(prod.available_quantity * 0.15));
    if (!inv) {
      await Inventory.create({
        product_id: prod.id,
        quantity: prod.available_quantity,
        reserved_quantity: reserved,
        location: loc
      });
    } else {
      await inv.update({
        quantity: prod.available_quantity,
        reserved_quantity: reserved,
        location: loc
      });
    }
  }

  // 3. Populate Cart for Admin User
  console.log('🛒 Populating active quotation cart for Admin...');
  let activeCart = await Cart.findOne({ where: { staff_id: adminUser.id, status: 'active' } });
  if (!activeCart) {
    activeCart = await Cart.create({ staff_id: adminUser.id, status: 'active' });
  }

  // Clear existing items and add 3 realistic items
  await CartItem.destroy({ where: { cart_id: activeCart.id } });
  const cartSeedItems = [
    { product_id: productRecords[1].id, quantity: 4, unit_price: productRecords[1].price }, // Motherboard
    { product_id: productRecords[4].id, quantity: 4, unit_price: productRecords[4].price }, // PSU
    { product_id: productRecords[5].id, quantity: 8, unit_price: productRecords[5].price }  // Stepper Motor
  ];
  for (const ci of cartSeedItems) {
    await CartItem.create({
      cart_id: activeCart.id,
      product_id: ci.product_id,
      quantity: ci.quantity,
      unit_price: ci.unit_price
    });
  }

  // 4. B2B Orders & Order Items
  console.log('📦 Seeding B2B corporate purchase orders...');
  const ordersData = [
    {
      order_number: 'ORD-2026-1001',
      customer_name: 'Apex Automation Systems Pvt Ltd',
      customer_email: 'procurement@apexauto.in',
      customer_phone: '+91 98401 23456',
      staff_id: salesRep.id,
      total_amount: 3245.00,
      order_status: 'Delivered',
      payment_method: 'Bank Transfer',
      payment_status: 'Paid',
      payment_amount: 3245.00,
      order_date: new Date('2026-09-25T10:30:00Z'),
      notes: 'Monthly batch delivery for robotic packaging plant. Invoice #INV-8821.',
      items: [
        { productIndex: 5, quantity: 20, unit_price: 45.00 }, // Stepper motor
        { productIndex: 8, quantity: 30, unit_price: 28.00 }, // Sensors
        { productIndex: 4, quantity: 12, unit_price: 125.00 } // PSU
      ]
    },
    {
      order_number: 'ORD-2026-1002',
      customer_name: 'Kovai Precision Tools & CNC Works',
      customer_email: 'purchase@kovaicnc.com',
      customer_phone: '+91 94432 67890',
      staff_id: salesRep.id,
      total_amount: 2790.00,
      order_status: 'Shipped',
      payment_method: 'Bank Transfer',
      payment_status: 'Partially Paid',
      payment_amount: 1500.00,
      order_date: new Date('2026-09-28T14:15:00Z'),
      notes: 'Urgent replacement parts for CNC horizontal milling line #3.',
      items: [
        { productIndex: 1, quantity: 6, unit_price: 185.00 },  // Motherboards
        { productIndex: 2, quantity: 4, unit_price: 389.50 },  // Processors
        { productIndex: 7, quantity: 4, unit_price: 32.50 }   // Noctua fans
      ]
    },
    {
      order_number: 'ORD-2026-1003',
      customer_name: 'Sri Lakshmi Tech Solutions',
      customer_email: 'orders@srilakshmitechin.com',
      customer_phone: '+91 98840 11223',
      staff_id: adminUser.id,
      total_amount: 4985.00,
      order_status: 'Processing',
      payment_method: 'Bank Transfer',
      payment_status: 'Paid',
      payment_amount: 4985.00,
      order_date: new Date('2026-10-01T09:00:00Z'),
      notes: 'Custom AI Edge Box build order. Scheduled for final QA inspection.',
      items: [
        { productIndex: 10, quantity: 4, unit_price: 799.00 }, // GPU
        { productIndex: 6, quantity: 6, unit_price: 149.00 },  // Chassis
        { productIndex: 3, quantity: 4, unit_price: 215.00 }   // ECC RAM
      ]
    },
    {
      order_number: 'ORD-2026-1004',
      customer_name: 'Metro Robotics & Drives',
      customer_email: 'hardware@metrorobotics.org',
      customer_phone: '+91 97910 88990',
      staff_id: salesRep.id,
      total_amount: 1450.00,
      order_status: 'Confirmed',
      payment_method: 'Credit Card',
      payment_status: 'Paid',
      payment_amount: 1450.00,
      order_date: new Date('2026-10-03T16:20:00Z'),
      notes: 'Advance paid in full. Preparing warehouse stock picking.',
      items: [
        { productIndex: 0, quantity: 5, unit_price: 169.99 }, // SSD
        { productIndex: 9, quantity: 10, unit_price: 19.99 }, // Fasteners
        { productIndex: 11, quantity: 8, unit_price: 42.00 }  // NIC
      ]
    },
    {
      order_number: 'ORD-2026-1005',
      customer_name: 'Zenith Electronics & Assembly Hub',
      customer_email: 'accounts@zenithelec.in',
      customer_phone: '+91 99620 55443',
      staff_id: salesRep.id,
      total_amount: 3820.00,
      order_status: 'Pending',
      payment_method: 'Bank Transfer',
      payment_status: 'Pending',
      payment_amount: 0.00,
      order_date: new Date('2026-10-05T11:45:00Z'),
      notes: 'New client quotation awaiting purchase order verification.',
      items: [
        { productIndex: 1, quantity: 8, unit_price: 185.00 },  // Motherboard
        { productIndex: 4, quantity: 10, unit_price: 125.00 }, // PSU
        { productIndex: 0, quantity: 6, unit_price: 169.99 }   // SSD
      ]
    }
  ];

  const orderRecords = [];
  for (const od of ordersData) {
    let order = await Order.findOne({ where: { order_number: od.order_number } });
    if (!order) {
      order = await Order.create({
        order_number: od.order_number,
        customer_name: od.customer_name,
        customer_email: od.customer_email,
        customer_phone: od.customer_phone,
        staff_id: od.staff_id,
        total_amount: od.total_amount,
        order_status: od.order_status,
        payment_method: od.payment_method,
        payment_status: od.payment_status,
        payment_amount: od.payment_amount,
        order_date: od.order_date,
        notes: od.notes
      });
      for (const it of od.items) {
        await OrderItem.create({
          order_id: order.id,
          product_id: productRecords[it.productIndex].id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total_price: Number((it.quantity * it.unit_price).toFixed(2))
        });
      }
    }
    orderRecords.push(order);
  }

  // 5. Deliveries
  console.log('🚚 Seeding deliveries & dispatch records...');
  const deliveriesData = [
    {
      order_id: orderRecords[0].id,
      delivery_staff_id: deliveryAgent.id,
      tracking_number: 'TRK-TN-2026-901',
      delivery_address: 'Plot 45, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058',
      recipient_name: 'Senthil Nathan (Store In-charge)',
      recipient_phone: '+91 98401 23456',
      delivery_date: new Date('2026-09-27T15:00:00Z'),
      expected_delivery_date: new Date('2026-09-27T18:00:00Z'),
      status: 'Delivered',
      notes: 'Delivered via Company Logistics Van TN-09-BG-4112. Received with signed seal.'
    },
    {
      order_id: orderRecords[1].id,
      delivery_staff_id: deliveryAgent.id,
      tracking_number: 'TRK-CBE-2026-442',
      delivery_address: 'SF No. 112/2, Trichy Road, Singanallur, Coimbatore 641005',
      recipient_name: 'D. Karthikeyan (Operations)',
      recipient_phone: '+91 94432 67890',
      delivery_date: null,
      expected_delivery_date: new Date('2026-10-07T12:00:00Z'),
      status: 'In Transit',
      notes: 'Dispatched via Express Courier. Consignment currently at Salem transshipment hub.'
    },
    {
      order_id: orderRecords[2].id,
      delivery_staff_id: deliveryAgent.id,
      tracking_number: 'TRK-BLR-2026-788',
      delivery_address: 'Tech Park Phase 2, Electronic City, Bengaluru, Karnataka 560100',
      recipient_name: 'M. Ramesh',
      recipient_phone: '+91 98840 11223',
      delivery_date: null,
      expected_delivery_date: new Date('2026-10-09T18:00:00Z'),
      status: 'Preparing',
      notes: 'Order undergoing staging and safety bubble packaging in Box Bay 3.'
    }
  ];

  for (const d of deliveriesData) {
    const existing = await Delivery.findOne({ where: { tracking_number: d.tracking_number } });
    if (!existing) {
      await Delivery.create(d);
    }
  }

  // 6. Production Batches
  console.log('🏭 Seeding manufacturing & production batches...');
  const productionsData = [
    {
      product_id: productRecords[1].id, // TitanCore B760 Motherboard
      quantity_planned: 120,
      quantity_producing: 45,
      quantity_completed: 65,
      weekly_capacity: 50,
      start_date: '2026-09-20',
      expected_completion_date: '2026-10-10',
      status: 'In Production',
      notes: 'Batch #BATCH-MB-2026-W39: High density SMT placement and automated optical inspection.'
    },
    {
      product_id: productRecords[4].id, // Mean Well 750W Power Supply
      quantity_planned: 200,
      quantity_producing: 0,
      quantity_completed: 200,
      weekly_capacity: 100,
      start_date: '2026-09-10',
      expected_completion_date: '2026-09-28',
      status: 'Completed',
      notes: 'Batch #BATCH-PSU-2026-W37: High voltage burn-in test passed for all 200 units.'
    },
    {
      product_id: productRecords[6].id, // Rugged Chassis
      quantity_planned: 80,
      quantity_producing: 30,
      quantity_completed: 25,
      weekly_capacity: 40,
      start_date: '2026-09-28',
      expected_completion_date: '2026-10-15',
      status: 'In Production',
      notes: 'Batch #BATCH-CHAS-2026-W40: CNC milling, deburring, and black matte anodizing stage.'
    },
    {
      product_id: productRecords[5].id, // Stepper Motor
      quantity_planned: 300,
      quantity_producing: 0,
      quantity_completed: 0,
      weekly_capacity: 150,
      start_date: '2026-10-12',
      expected_completion_date: '2026-10-26',
      status: 'Planned',
      notes: 'Batch #BATCH-STEP-2026-W42: Scheduled for stator coil winding after copper spool delivery.'
    }
  ];

  const productionRecords = [];
  for (const pd of productionsData) {
    let p = await Production.findOne({ where: { product_id: pd.product_id, start_date: pd.start_date } });
    if (!p) {
      p = await Production.create(pd);
    }
    productionRecords.push(p);
  }

  // 7. Manufacturing Assignments
  console.log('👷 Seeding factory floor staff assignments...');
  const assignmentsData = [
    {
      staff_id: storeMgr.id,
      sector: 'SMT Surface Mount Station',
      product_id: productRecords[1].id,
      start_date: '2026-10-01',
      status: 'Working',
      shift: 'Day',
      notes: 'Managing Yamaha SMT pick-and-place nozzle calibration and solder paste stenciling.'
    },
    {
      staff_id: qcInspector.id,
      sector: 'Component Testing Station',
      product_id: productRecords[4].id,
      start_date: '2026-10-01',
      status: 'Working',
      shift: 'Day',
      notes: 'Supervising oscilloscope voltage waveform and thermal probe testing.'
    },
    {
      staff_id: adminUser.id,
      sector: 'Chassis & Enclosure Fabrication',
      product_id: productRecords[6].id,
      start_date: '2026-09-28',
      status: 'Completed',
      shift: 'Day',
      notes: 'CNC Haas VF-4 setup and tooling check completed.'
    }
  ];

  for (const a of assignmentsData) {
    const existing = await ManufacturingAssignment.findOne({
      where: { staff_id: a.staff_id, sector: a.sector }
    });
    if (!existing) {
      await ManufacturingAssignment.create(a);
    }
  }

  // 8. Quality Inspections (QC)
  console.log('🔍 Seeding quality control & inspection records...');
  const inspectionsData = [
    {
      inspector_id: qcInspector.id,
      product_id: productRecords[1].id,
      production_id: productionRecords[0].id,
      inspection_date: '2026-10-02',
      item_type: 'Finished Good',
      batch_number: 'BATCH-MB-2026-W39',
      quantity_inspected: 25,
      passed_quantity: 24,
      failed_quantity: 1,
      result: 'Passed',
      defect_type: 'Solder Bridge / Short Circuit',
      severity: 'Medium',
      notes: '24 units passed with zero noise. 1 unit had minor solder splash on pin 14 (sent to rework bench).'
    },
    {
      inspector_id: qcInspector.id,
      product_id: productRecords[4].id,
      production_id: productionRecords[1].id,
      inspection_date: '2026-09-28',
      item_type: 'Finished Good',
      batch_number: 'BATCH-PSU-2026-W37',
      quantity_inspected: 50,
      passed_quantity: 50,
      failed_quantity: 0,
      result: 'Passed',
      defect_type: 'None / Clean Pass',
      severity: 'Low',
      notes: 'Full 100% burn-in load test passed at 750W continuous draw for 2 hours.'
    },
    {
      inspector_id: qcInspector.id,
      product_id: productRecords[6].id,
      production_id: productionRecords[2].id,
      inspection_date: '2026-10-04',
      item_type: 'Sub-assembly',
      batch_number: 'BATCH-CHAS-2026-W40',
      quantity_inspected: 10,
      passed_quantity: 8,
      failed_quantity: 2,
      result: 'Failed',
      defect_type: 'Enclosure Tolerance Issue',
      severity: 'High',
      notes: 'Front rack ear mounting holes offset by +0.8mm. CNC tool offset re-zeroed.'
    }
  ];

  for (const ins of inspectionsData) {
    const existing = await Inspection.findOne({ where: { batch_number: ins.batch_number, inspection_date: ins.inspection_date } });
    if (!existing) {
      await Inspection.create(ins);
    }
  }

  // 9. Returns (RMA)
  console.log('🔄 Seeding RMA returns and replacement logs...');
  const returnsData = [
    {
      return_number: 'RMA-2026-0038',
      order_id: orderRecords[0].id,
      product_id: productRecords[5].id, // Stepper Motor
      customer_name: 'Apex Automation Systems Pvt Ltd',
      quantity: 2,
      return_reason: 'Shaft tolerance 6.42mm instead of 6.35mm; motor pulley slipping under 10kg load.',
      return_date: new Date('2026-09-30T11:00:00Z'),
      status: 'Approved',
      replacement_required: true,
      replacement_product_id: productRecords[5].id,
      replacement_quantity: 2,
      notes: 'RMA authorized by QA. Replacement dispatched in next consolidated shipment.'
    },
    {
      return_number: 'RMA-2026-0039',
      order_id: orderRecords[0].id,
      product_id: productRecords[8].id, // Sensor
      customer_name: 'Apex Automation Systems Pvt Ltd',
      quantity: 1,
      return_reason: 'Lens scratched during unpacking at client site.',
      return_date: new Date('2026-10-01T14:30:00Z'),
      status: 'Completed',
      replacement_required: false,
      notes: 'Credit note issued against next invoice.'
    }
  ];

  for (const ret of returnsData) {
    const existing = await Return.findOne({ where: { return_number: ret.return_number } });
    if (!existing) {
      await Return.create(ret);
    }
  }

  // 10. Expenses & Incomes
  console.log('💰 Seeding manufacturing factory expenses and revenues...');
  const expensesData = [
    {
      staff_id: adminUser.id,
      title: 'TNEB Industrial Factory Electricity Bill (September SMT & CNC)',
      type: 'Expense',
      category: 'Factory Utilities & Power',
      amount: 48500.00,
      date: '2026-10-02',
      payment_method: 'Bank Transfer',
      reference_no: 'TNEB-HT-2026-09-418',
      notes: 'High-tension commercial industrial power tariff for Assembly Units 1 & 2.'
    },
    {
      staff_id: storeMgr.id,
      title: 'Bulk Aluminum 6061-T6 Extrusion Bar Stock (500 kg)',
      type: 'Expense',
      category: 'Raw Materials & Silicon',
      amount: 115000.00,
      date: '2026-09-26',
      payment_method: 'Bank Transfer',
      reference_no: 'INV-HINDALCO-8910',
      notes: 'Raw material procurement for 2U chassis and custom heatsink machining.'
    },
    {
      staff_id: storeMgr.id,
      title: 'Haas CNC Spindle Maintenance & Calibration Service',
      type: 'Expense',
      category: 'Maintenance & Repairs',
      amount: 14500.00,
      date: '2026-09-29',
      payment_method: 'Bank Transfer',
      reference_no: 'SRV-HAAS-4412',
      notes: 'Quarterly spindle bearing balance check and coolant pump filter replacement.'
    },
    {
      staff_id: deliveryAgent.id,
      title: 'Blue Dart Logistics Monthly Freight Dispatch Charges',
      type: 'Expense',
      category: 'Logistics & Freight Shipping',
      amount: 22800.00,
      date: '2026-10-01',
      payment_method: 'Bank Transfer',
      reference_no: 'BD-BILL-SEP26-78',
      notes: 'All inter-state B2B consignments and freight pallet shipping.'
    },
    {
      staff_id: salesRep.id,
      title: 'Advance Payment Received from Apex Automation (PO #8821)',
      type: 'Income',
      category: 'Product Sales Revenue',
      amount: 265000.00,
      date: '2026-09-25',
      payment_method: 'Bank Transfer',
      reference_no: 'NEFT-HDFC-991048',
      notes: '70% advance payment for customized robotic controller batch.'
    }
  ];

  for (const exp of expensesData) {
    const existing = await Expense.findOne({ where: { reference_no: exp.reference_no } });
    if (!existing) {
      await Expense.create(exp);
    }
  }

  // 11. Notifications
  console.log('🔔 Seeding system notifications for Admin...');
  const notificationsData = [
    {
      recipient_staff_id: adminUser.id,
      title: 'Low Stock Alert: High-Torque NEMA 23 Stepper Motor',
      message: 'Reserved quantities for upcoming orders have brought safety buffer below reorder limit (18 units free).',
      type: 'inventory',
      is_read: false
    },
    {
      recipient_staff_id: adminUser.id,
      title: 'Production Batch Completed: BATCH-PSU-2026-W37',
      message: '200 units of Mean Well 750W Power Supplies passed 100% burn-in QC and moved to Finished Goods storage.',
      type: 'production',
      is_read: false
    },
    {
      recipient_staff_id: adminUser.id,
      title: 'New B2B Order Received: ORD-2026-1005',
      message: 'Zenith Electronics placed order for 24 hardware components totaling $3,820.00.',
      type: 'order',
      is_read: true
    },
    {
      recipient_staff_id: adminUser.id,
      title: 'Shipment Out for Delivery: TRK-CBE-2026-442',
      message: 'Consignment for Kovai Precision Tools has arrived at Coimbatore distribution hub.',
      type: 'delivery',
      is_read: true
    }
  ];

  for (const n of notificationsData) {
    const existing = await Notification.findOne({
      where: { recipient_staff_id: n.recipient_staff_id, title: n.title }
    });
    if (!existing) {
      await Notification.create(n);
    }
  }

  console.log('✅ All realistic manufacturing & B2B data seeded successfully!');
  process.exit(0);
}

seedRealisticData().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
