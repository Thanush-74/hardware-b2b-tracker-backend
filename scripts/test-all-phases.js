const { spawnSync } = require('child_process');

const testSuites = [
  { name: 'Auth & RBAC Foundation', script: 'scripts/test-backend.js' },
  { name: 'Phase 1: Products Module', script: 'scripts/test-product-api.js' },
  { name: 'Phase 2: Cart Module', script: 'scripts/test-cart-api.js' },
  { name: 'Phase 3: Inventory Module', script: 'scripts/test-inventory-api.js' },
  { name: 'Phase 4: Production Module', script: 'scripts/test-production-api.js' },
  { name: 'Phase 5: Customer Orders Module', script: 'scripts/test-orders-api.js' },
  { name: 'Phase 6: Delivery Logistics Module', script: 'scripts/test-deliveries-api.js' },
  { name: 'Phase 7: Return & Replacement Module', script: 'scripts/test-returns-api.js' },
  { name: 'Phase 8: Manufacturing Area Module', script: 'scripts/test-manufacturing-api.js' },
  { name: 'Phase 9: Expenses & Financials Module', script: 'scripts/test-expenses-api.js' },
  { name: 'Phase 10: Quality Inspection Module', script: 'scripts/test-inspections-api.js' }
];

console.log('========================================================================');
console.log('       HARDWARE B2B TRACKER BACKEND - FULL SYSTEM TEST SUITE RUN        ');
console.log('========================================================================\n');

let passedSuites = 0;
let failedSuites = 0;

testSuites.forEach((suite, index) => {
  console.log(`[${index + 1}/${testSuites.length}] Running ${suite.name}...`);
  const result = spawnSync('node', [suite.script], { stdio: 'inherit' });
  if (result.status === 0) {
    passedSuites++;
  } else {
    failedSuites++;
    console.error(`❌ Suite Failed: ${suite.name}`);
  }
  console.log('\n------------------------------------------------------------------------\n');
});

console.log('========================================================================');
console.log(`FINAL RESULT: ${passedSuites}/${testSuites.length} Test Suites Passed (${failedSuites} Failed)`);
console.log('========================================================================');

if (failedSuites > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 10 BUSINESS MODULES + AUTH/RBAC ARE VERIFIED AND 100% OPERATIONAL!');
  process.exit(0);
}
