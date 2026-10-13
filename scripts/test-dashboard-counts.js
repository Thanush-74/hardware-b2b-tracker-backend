const { Inventory, Product, Production, sequelize } = require('../models');
const { Op } = require('sequelize');

const BASE_URL = 'http://localhost:3000/api';

async function testDashboardCounts() {
  console.log('====================================================');
  console.log('TESTING DASHBOARD LOW STOCK AND ACTIVE PRODUCTIONS');
  console.log('====================================================\n');

  await sequelize.authenticate();
  console.log('PostgreSQL Connected successfully.\n');

  // 1. Authenticate to get JWT token
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@company.com', password: 'password' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  if (!token) {
    throw new Error('Failed to obtain auth token');
  }
  console.log('✅ Authenticated as Admin via API');

  // 2. Direct DB verification
  const dbLowStock = await Inventory.count({
    distinct: true,
    col: 'id',
    include: [{ model: Product, as: 'product', where: { is_active: true }, required: true }],
    where: sequelize.where(
      sequelize.literal('"Inventory"."quantity" - "Inventory"."reserved_quantity"'),
      { [Op.lte]: 10 }
    )
  });

  const dbActiveProd = await Production.count({
    where: { status: 'In Production' }
  });

  console.log(`\n--- Direct Database Counts ---`);
  console.log(`DB Low Stock Count (available <= 10): ${dbLowStock}`);
  console.log(`DB Active Productions Count (status 'In Production'): ${dbActiveProd}`);

  // 3. API endpoint verification
  const invRes = await fetch(`${BASE_URL}/inventory`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const invData = await invRes.json();

  const prodRes = await fetch(`${BASE_URL}/production`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const prodData = await prodRes.json();

  console.log(`\n--- Backend API Responses ---`);
  console.log(`API low_stock_count: ${invData.data.low_stock_count}`);
  console.log(`API active_count: ${prodData.data.active_count}`);
  console.log(`API production_records length: ${prodData.data.production_records.length}`);
  console.log(`API productions alias length: ${prodData.data.productions.length}`);

  if (invData.data.low_stock_count !== dbLowStock) {
    throw new Error(`Inventory count mismatch: API (${invData.data.low_stock_count}) != DB (${dbLowStock})`);
  }
  console.log('✅ Inventory API matches PostgreSQL database count exactly!');

  if (prodData.data.active_count !== dbActiveProd) {
    throw new Error(`Production count mismatch: API (${prodData.data.active_count}) != DB (${dbActiveProd})`);
  }
  console.log('✅ Production API matches PostgreSQL database count exactly!');

  // 4. Test Frontend Logic Simulation
  // Inventory simulation
  const items = invData.data.inventory;
  const simulatedFrontendLowStock =
    typeof invData.data.low_stock_count === 'number'
      ? invData.data.low_stock_count
      : items.filter(item => {
          if (!item || !item.product_id || item.is_active === false) return false;
          const qty = item.available_quantity ?? item.quantity;
          return typeof qty === 'number' && !isNaN(qty) && qty <= 10;
        }).length;

  // Production simulation
  const records = prodData.data.production_records || prodData.data.productions;
  const simulatedFrontendActiveProd =
    typeof prodData.data.active_count === 'number'
      ? prodData.data.active_count
      : records.filter(r => r.status === 'In Production').length;

  console.log(`\n--- Frontend Calculation Verification ---`);
  console.log(`Frontend simulated Low Stock Items: ${simulatedFrontendLowStock}`);
  console.log(`Frontend simulated Active Productions: ${simulatedFrontendActiveProd}`);

  if (simulatedFrontendLowStock !== dbLowStock) {
    throw new Error('Frontend low stock calculation does not match DB!');
  }
  if (simulatedFrontendActiveProd !== dbActiveProd) {
    throw new Error('Frontend active production calculation does not match DB!');
  }

  console.log('\n====================================================');
  console.log('ALL DASHBOARD COUNT VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('====================================================');

  await sequelize.close();
}

testDashboardCounts().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
