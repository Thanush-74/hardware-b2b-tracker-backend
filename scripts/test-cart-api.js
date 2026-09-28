const BASE_URL = 'http://localhost:3000';

const runCartTests = async () => {
  console.log('====================================================');
  console.log('STARTING CART MODULE (PHASE 2) TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} - Details: ${details}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate as Admin
    console.log('\n--- 1. Authenticating as Admin ---');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'password'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    assert(token && token.length > 20, 'Admin token acquired');

    // 2. Fetch active products to get existing product IDs
    const productsRes = await fetch(`${BASE_URL}/api/products?is_active=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const productsData = await productsRes.json();
    let products = productsData.data.products;

    // If there are fewer than 2 active products, create test products
    if (products.length < 2) {
      const p1Res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: 'RAM 8GB', type: 'RAM', price: 29.99, available_quantity: 100 })
      });
      const p1Data = await p1Res.json();
      const p2Res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: 'SSD 512GB', type: 'SSD', price: 59.99, available_quantity: 50 })
      });
      const p2Data = await p2Res.json();
      products = [p1Data.data, p2Data.data];
    }
    assert(products.length >= 2, 'Found at least 2 products for cart testing');

    const product1 = products[0];
    const product2 = products[1];

    // 3. Clear cart first to start clean
    console.log('\n--- 2. Testing Clear Cart (DELETE /api/cart) ---');
    const clearRes = await fetch(`${BASE_URL}/api/cart`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const clearData = await clearRes.json();
    assert(clearRes.status === 200, 'Clear cart status is 200 OK');
    assert(clearData.data.items.length === 0, 'Cart items list is empty');
    assert(clearData.data.cart_total === 0, 'Cart total is 0');

    // 4. View Empty Cart (GET /api/cart)
    console.log('\n--- 3. Testing Get Empty Cart (GET /api/cart) ---');
    const getCartRes = await fetch(`${BASE_URL}/api/cart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getCartData = await getCartRes.json();
    assert(getCartRes.status === 200, 'Get cart status is 200 OK');
    assert(getCartData.data.total_items === 0, 'Total items count is 0');

    // 5. Add Product 1 to Cart (POST /api/cart)
    console.log('\n--- 4. Testing Add Item to Cart (POST /api/cart) ---');
    const addRes1 = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: product1.id,
        quantity: 3
      })
    });
    const addData1 = await addRes1.json();
    assert(addRes1.status === 200, 'Add item to cart status is 200 OK');
    assert(addData1.data.items.length === 1, 'Cart has 1 item type');
    assert(addData1.data.items[0].quantity === 3, 'Item quantity is 3');
    
    const expectedItemTotal1 = Number((3 * Number(product1.price)).toFixed(2));
    assert(addData1.data.items[0].item_total === expectedItemTotal1, `Item total correctly calculated ($${expectedItemTotal1})`);
    assert(addData1.data.cart_total === expectedItemTotal1, `Cart total matches item total ($${expectedItemTotal1})`);

    const cartItemId = addData1.data.items[0].id;

    // 6. Add Product 2 to Cart
    console.log('\n--- 5. Testing Add Second Item to Cart ---');
    const addRes2 = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: product2.id,
        quantity: 2
      })
    });
    const addData2 = await addRes2.json();
    assert(addData2.data.items.length === 2, 'Cart has 2 item types');
    assert(addData2.data.total_items === 5, 'Total quantity of items is 5 (3 + 2)');

    const expectedCartTotal = Number((expectedItemTotal1 + (2 * Number(product2.price))).toFixed(2));
    assert(addData2.data.cart_total === expectedCartTotal, `Cart total correctly summed ($${expectedCartTotal})`);

    // 7. Update Quantity of Item (PUT /api/cart/:id)
    console.log('\n--- 6. Testing Update Cart Item Quantity (PUT /api/cart/:id) ---');
    const updateRes = await fetch(`${BASE_URL}/api/cart/${cartItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity: 5 })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Update cart item status is 200 OK');
    const updatedItem = updateData.data.items.find(i => i.id === cartItemId);
    assert(updatedItem && updatedItem.quantity === 5, 'Cart item quantity updated to 5');

    // 8. Validation: Reject zero or negative quantity
    console.log('\n--- 7. Testing Invalid Quantity Validations ---');
    const invalidQtyRes = await fetch(`${BASE_URL}/api/cart/${cartItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity: 0 })
    });
    const invalidQtyData = await invalidQtyRes.json();
    assert(invalidQtyRes.status === 400 && invalidQtyData.success === false, 'Zero quantity rejected with 400 Bad Request');

    const negativeQtyRes = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: product1.id, quantity: -2 })
    });
    const negativeQtyData = await negativeQtyRes.json();
    assert(negativeQtyRes.status === 400 && negativeQtyData.success === false, 'Negative quantity rejected with 400 Bad Request');

    // 9. Validation: Reject quantity exceeding available stock
    const excessQtyRes = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: product1.id, quantity: 999999 })
    });
    const excessQtyData = await excessQtyRes.json();
    assert(excessQtyRes.status === 400 && excessQtyData.success === false, 'Quantity exceeding stock rejected with 400 Bad Request');

    // 10. Remove Single Item (DELETE /api/cart/:id)
    console.log('\n--- 8. Testing Remove Single Item (DELETE /api/cart/:id) ---');
    const removeRes = await fetch(`${BASE_URL}/api/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const removeData = await removeRes.json();
    assert(removeRes.status === 200, 'Remove item status is 200 OK');
    assert(removeData.data.items.length === 1, 'Cart has 1 item remaining');
    assert(!removeData.data.items.some(i => i.id === cartItemId), 'Removed item is no longer in cart');

    // 11. Unauthorized cart access without token
    console.log('\n--- 9. Testing Auth Protection without Token ---');
    const unauthRes = await fetch(`${BASE_URL}/api/cart`);
    const unauthData = await unauthRes.json();
    assert(unauthRes.status === 401 && unauthData.success === false, 'Unauthenticated cart request rejected with 401');

    console.log('\n====================================================');
    console.log(`CART TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
};

runCartTests();
