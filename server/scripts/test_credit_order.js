(async () => {
  try {
    const base = 'http://localhost:5000/api';

    const loginRes = await fetch(`${base}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
    });
    const login = await loginRes.json();
    if (!login.token) throw new Error('Login failed: ' + JSON.stringify(login));
    const token = login.token;
    console.log('Logged in, token length:', token.length);

    const productsRes = await fetch(`${base}/products`, { headers: { Authorization: `Bearer ${token}` } });
    const products = await productsRes.json();
    if (!products.length) throw new Error('No products available');
    const product = products[0];
    console.log('Using product:', product.name, 'price', product.price);

    const customersRes = await fetch(`${base}/customers`, { headers: { Authorization: `Bearer ${token}` } });
    const customers = await customersRes.json();
    if (!customers.length) throw new Error('No customers found');

    // choose a customer (prefer one with non-zero balance for visibility)
    const customer = customers.find(c => c.balance >= 0) || customers[0];
    console.log('Using customer:', customer.name, 'balance before:', customer.balance);

    const orderItems = [{ product: product._id, name: product.name, qty: 1, price: product.price }];
    const totalAmount = product.price;

    const orderRes = await fetch(`${base}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderItems, paymentMethod: 'Credit', totalAmount, taxAmount: 0, discountAmount: 0, customerId: customer._id, paidAmount: 0 })
    });
    const order = await orderRes.json();
    console.log('Order response status:', orderRes.status);
    console.log('Order created id:', order._id || order.message || JSON.stringify(order));

    // fetch customer ledger
    const ledgerRes = await fetch(`${base}/customers/${customer._id}/ledger`, { headers: { Authorization: `Bearer ${token}` } });
    const ledger = await ledgerRes.json();
    console.log('Ledger:', JSON.stringify(ledger.entries?.slice(0,3), null, 2));

    // fetch updated customer
    const updatedCustomerRes = await fetch(`${base}/customers/${customer._id}`, { headers: { Authorization: `Bearer ${token}` } });
    const updatedCustomer = await updatedCustomerRes.json();
    console.log('Customer after:', updatedCustomer.name, 'balance:', updatedCustomer.balance);

    if (orderRes.status === 201) {
      console.log('Credit order recorded successfully.');
    } else {
      console.error('Credit order failed:', JSON.stringify(order));
    }

  } catch (err) {
    console.error('Error during test credit order:', err);
    process.exit(1);
  }
})();