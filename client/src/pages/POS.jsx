import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Invoice from '../components/Invoice';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const POS = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const componentRef = useRef();

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);

    // prevent adding beyond stock
    const currentQty = existingItem ? existingItem.qty : 0;
    if (currentQty + 1 > product.stock) {
      alert(`Insufficient stock for ${product.name}`);
      return;
    }

    if (existingItem) {
      setCart(cart.map(item =>
        item._id === product._id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id));
  };

  const updateQty = (id, change) => {
    setCart(cart.map(item => {
      if (item._id === id) {
        const newQty = item.qty + change;
        // Find latest product stock
        const prod = products.find(p => p._id === id);
        if (newQty < 1) return item; // prevent below 1
        if (prod && newQty > prod.stock) {
          alert(`Only ${prod.stock} unit(s) available for ${prod.name}`);
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const taxAmount = +( (subtotal * (Number(taxRate) || 0)) / 100 ).toFixed(2);
  // Clamp discount so total can't go negative
  const safeDiscount = Math.max(0, Math.min(Number(discount) || 0, subtotal + taxAmount));
  const total = +(Math.max(0, subtotal + taxAmount - safeDiscount)).toFixed(2);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const projectedBalance = selectedCustomer
    ? selectedCustomer.balance + (paymentMethod === 'Credit' ? total : 0)
    : 0;

  const handleCheckout = async () => {
    try {
      if (cart.length === 0) {
        alert('Cart is empty!');
        return;
      }

      // Validate discount/tax inputs
      if (isNaN(discount) || Number(discount) < 0) {
        alert('Invalid discount amount');
        return;
      }
      if (isNaN(taxRate) || Number(taxRate) < 0) {
        alert('Invalid tax rate');
        return;
      }

      // Ensure quantities don't exceed stock (final check)
      for (const item of cart) {
        const prod = products.find(p => p._id === item._id);
        if (!prod) {
          alert(`Product not found: ${item.name}`);
          return;
        }
        if (item.qty > prod.stock) {
          alert(`Insufficient stock for ${prod.name}`);
          return;
        }
      }

      // Prepare order payload exactly matching backend field names
      const payload = {
        customer: selectedCustomer?._id || null,
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          qty: item.qty,
          price: item.price
        })),
        totalAmount: total,
        taxAmount,
        discountAmount: safeDiscount,
        paymentMethod
      };

      console.log('Order payload ->', payload);

      // Create order (backend validates stock, customer, computes profit)
      const { data: createdOrder } = await api.post('/orders', payload);

      // Refresh customers/products to reflect balance and stock changes
      await fetchProducts();
      await fetchCustomers();

      // notify ledger pages (auto-refresh if open)
      try { window.dispatchEvent(new CustomEvent('pos:orderCreated', { detail: createdOrder })); } catch (err) { /* ignore in older browsers */ }

      // Print invoice if user confirms
      if (window.confirm('Order created successfully. Print invoice now?')) {
        handlePrint();
      }

      // Reset cart & checkout state
      setCart([]);
      setIsCheckoutOpen(false);
      setDiscount(0);
      setTaxRate(0);
      setSelectedCustomer(null);
      setPaymentMethod('Cash');

    } catch (error) {
      console.error(error.response || error);
      alert(error.response?.data?.message || 'Order Failed');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-4 bg-gray-100 dark:bg-gray-900">

      {/* LEFT: PRODUCTS */}
      <div className="flex-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div
              key={product._id}
              onClick={() => addToCart(product)}
              className="rounded-lg p-3 cursor-pointer border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 transition"
            >
              <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-1">{product.name}</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">{product.category}</span>

              <div className="mt-2 flex justify-between items-end">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Rs {product.price}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock > 0
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>{product.stock}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: CART */}
      <div className="w-full lg:w-96 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 bg-indigo-600 dark:bg-indigo-700 text-white rounded-t-lg">
          <h2 className="font-bold flex items-center">
            <ShoppingCart className="mr-2" size={20} /> Current Order
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 mt-10">Cart is empty</div>
          ) : cart.map(item => (
            <div key={item._id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.name}</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400">Rs {item.price} x {item.qty}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => updateQty(item._id, -1)} className="p-1 rounded bg-gray-200 dark:bg-gray-600">
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">{item.qty}</span>
                <button onClick={() => updateQty(item._id, 1)} className="p-1 rounded bg-gray-200 dark:bg-gray-600">
                  <Plus size={14} />
                </button>
                <button onClick={() => removeFromCart(item._id)} className="text-red-500 dark:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 space-y-2">
          <div className="flex justify-between text-sm text-gray-700 dark:text-gray-200">
            <span>Subtotal</span>
            <span>Rs {subtotal}</span>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-200">
            <span>Discount</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-20 p-1 text-right rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500"
            />
          </div>

          <div className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-200">
            <span>Tax %</span>
            <input
              type="number"
              min="0"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-20 p-1 text-right rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500"
            />
          </div>

          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-600 text-indigo-700 dark:text-indigo-400">
            <span>Total</span>
            <span>Rs {total}</span>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cart.length === 0}
            className="w-full mt-4 py-3 rounded-md font-bold bg-indigo-600 dark:bg-indigo-700 text-white disabled:opacity-50"
          >
            Place Order (Rs {total})
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Checkout">
        <div className="space-y-4">

          {/* Customer */}
          <select
            className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
            value={selectedCustomer?._id || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return setSelectedCustomer(null);
              setSelectedCustomer(customers.find(c => c._id === val) || null);
            }}
          >
            <option value="">Walk-in Customer</option>
            {customers.map(c => (
              <option key={c._id} value={c._id}>
                {c.name} - {c.phone} (Balance: Rs {c.balance})
              </option>
            ))}
          </select>

          {/* Payment Method */}
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Online">Online</option>
            <option value="Credit">Credit</option>
          </select>

          {/* Totals summary */}
          <div className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between"><span>Subtotal</span><span>Rs {subtotal}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>Rs {taxAmount}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>Rs {safeDiscount}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t mt-2"><span>Total</span><span>Rs {total}</span></div>
          </div>

          {/* Projected Balance Warning */}
          {selectedCustomer && paymentMethod === 'Credit' && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              ⚠ Projected Balance: Rs {projectedBalance}
            </p>
          )}

          <button
            onClick={handleCheckout}
            className="w-full py-3 rounded-md font-bold bg-green-600 dark:bg-green-700 text-white"
          >
            Confirm {paymentMethod} Payment (Rs {total})
          </button>
        </div>
      </Modal>

      {/* PRINT */}
      <div className="hidden">
        <Invoice
          ref={componentRef}
          cart={cart}
          total={total}
          tax={taxAmount}
          discount={discount}
          customer={selectedCustomer}
          user={user}
          date={new Date().toLocaleDateString()}
        />
      </div>
    </div>
  );
};

export default POS;
