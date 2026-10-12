const { globalSearch } = require('../services/searchService');

async function test() {
  console.log('Testing global search...');
  const adminRes = await globalSearch('1', { role: { slug: 'admin' } }, []);
  console.log('Admin search for "1":', Object.keys(adminRes).map(k => `${k}: ${adminRes[k].length}`).join(', '));
  
  const productRes = await globalSearch('GPU', { role: { slug: 'admin' } }, []);
  console.log('Admin search for "GPU":', Object.keys(productRes).map(k => `${k}: ${productRes[k].length}`).join(', '));

  const orderRes = await globalSearch('ORD', { role: { slug: 'admin' } }, []);
  console.log('Admin search for "ORD":', Object.keys(orderRes).map(k => `${k}: ${orderRes[k].length}`).join(', '));
  if (orderRes.deliveries.length > 0) {
    console.log('Found deliveries matching order ORD:', orderRes.deliveries[0].title, orderRes.deliveries[0].subtitle);
  }
  if (orderRes.returns.length > 0) {
    console.log('Found returns matching order ORD:', orderRes.returns[0].title, orderRes.returns[0].subtitle);
  }

  const rbacRes = await globalSearch('admin', { role: { slug: 'delivery' } }, ['deliveries.view']);
  console.log('Driver search for "admin":', Object.keys(rbacRes).map(k => `${k}: ${rbacRes[k].length}`).join(', '));

  const emptyRes = await globalSearch('   ', { role: { slug: 'admin' } }, []);
  console.log('Whitespace search:', Object.keys(emptyRes).map(k => `${k}: ${emptyRes[k].length}`).join(', '));

  process.exit(0);
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
