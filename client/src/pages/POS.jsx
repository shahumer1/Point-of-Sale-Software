// import React, { useState, useEffect, useRef } from 'react';
// import { useTranslation } from 'react-i18next';
// import api from '../utils/api';
// import { Search, Plus, Minus, Trash2, ShoppingCart, Printer } from 'lucide-react';
// import { useReactToPrint } from 'react-to-print';
// import Invoice from '../components/Invoice';
// import { useAuth } from '../context/AuthContext';
// import Modal from '../components/Modal';

// const POS = () => {
//     const { t } = useTranslation();
//     const { user } = useAuth();
//     const [products, setProducts] = useState([]);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [cart, setCart] = useState([]);
//     const [customers, setCustomers] = useState([]);
//     const [selectedCustomer, setSelectedCustomer] = useState(null);
//     const [discount, setDiscount] = useState(0);
//     const [taxRate, setTaxRate] = useState(0);
//     const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
//     const [paymentMethod, setPaymentMethod] = useState('Cash');

//     const componentRef = useRef();

//     useEffect(() => {
//         fetchProducts();
//         fetchCustomers();
//     }, []);

//     const fetchProducts = async () => {
//         try {
//             const { data } = await api.get('/products');
//             setProducts(data);
//         } catch (error) {
//             console.error(error);
//         }
//     };

//     const fetchCustomers = async () => {
//         try {
//             const { data } = await api.get('/customers');
//             setCustomers(data);
//         } catch (error) {
//             console.error(error);
//         }
//     };

//     const addToCart = (product) => {
//         const existingItem = cart.find(item => item._id === product._id);
//         if (existingItem) {
//             setCart(cart.map(item =>
//                 item._id === product._id ? { ...item, qty: item.qty + 1 } : item
//             ));
//         } else {
//             setCart([...cart, { ...product, qty: 1 }]);
//         }
//     };

//     const removeFromCart = (id) => {
//         setCart(cart.filter(item => item._id !== id));
//     };

//     const updateQty = (id, change) => {
//         setCart(cart.map(item => {
//             if (item._id === id) {
//                 const newQty = item.qty + change;
//                 return newQty > 0 ? { ...item, qty: newQty } : item;
//             }
//             return item;
//         }));
//     };

//     const filteredProducts = products.filter(p =>
//         p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         p.sku.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
//     const taxAmount = (subtotal * taxRate) / 100;
//     const total = subtotal + taxAmount - discount;

//     const handlePrint = useReactToPrint({
//         content: () => componentRef.current,
//     });

//     const handleCheckout = async () => {
//         try {
//             const orderData = {
//                 orderItems: cart.map(item => ({
//                     product: item._id,
//                     name: item.name,
//                     qty: item.qty,
//                     price: item.price
//                 })),
//                 paymentMethod,
//                 totalAmount: total,
//                 taxAmount,
//                 discountAmount: discount,
//                 customerId: selectedCustomer ? selectedCustomer._id : null
//             };

//             await api.post('/orders', orderData);
//             fetchProducts(); // Refresh stock

//             if (window.confirm('Order Successful! Do you want to print the invoice?')) {
//                 handlePrint();
//             }

//             setCart([]);
//             setIsCheckoutOpen(false);
//             setDiscount(0);
//             setSelectedCustomer(null);
//         } catch (error) {
//             console.error(error);
//             alert('Order Failed');
//         }
//     };

//     return (
//         <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-4">
//             {/* Left: Product Grid */}
//             <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
//                 <div className="p-4 border-b">
//                     <div className="relative">
//                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                             <Search className="h-5 w-5 text-gray-400" />
//                         </div>
//                         <input
//                             type="text"
//                             placeholder={t('search')}
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                             className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
//                             autoFocus
//                         />
//                     </div>
//                 </div>

//                 <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
//                     {filteredProducts.map(product => (
//                         <div
//                             key={product._id}
//                             onClick={() => addToCart(product)}
//                             className="bg-gray-50 border hover:border-indigo-500 cursor-pointer rounded-lg p-3 flex flex-col justify-between transition-all"
//                         >
//                             <div>
//                                 <h4 className="font-semibold text-gray-800 text-sm mb-1">{product.name}</h4>
//                                 <span className="text-xs text-gray-500 truncate block">{product.category}</span>
//                             </div>
//                             <div className="mt-2 flex justify-between items-end">
//                                 <span className="font-bold text-indigo-600">Rs {product.price}</span>
//                                 <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
//                                     {product.stock}
//                                 </span>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             {/* Right: Cart */}
//             <div className="w-full lg:w-96 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
//                 <div className="p-4 border-b bg-indigo-600 text-white rounded-t-lg">
//                     <h2 className="font-bold flex items-center">
//                         <ShoppingCart className="mr-2" size={20} />
//                         Current Order
//                     </h2>
//                 </div>

//                 <div className="flex-1 overflow-y-auto p-4 space-y-3">
//                     {cart.length === 0 ? (
//                         <div className="text-center text-gray-400 mt-10">Cart is empty</div>
//                     ) : (
//                         cart.map(item => (
//                             <div key={item._id} className="flex justify-between items-center border-b pb-2">
//                                 <div className="flex-1">
//                                     <h4 className="font-medium text-sm text-gray-800">{item.name}</h4>
//                                     <div className="text-xs text-gray-500">Rs {item.price} x {item.qty}</div>
//                                 </div>
//                                 <div className="flex items-center space-x-2">
//                                     <button onClick={() => updateQty(item._id, -1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
//                                         <Minus size={14} />
//                                     </button>
//                                     <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
//                                     <button onClick={() => updateQty(item._id, 1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
//                                         <Plus size={14} />
//                                     </button>
//                                     <button onClick={() => removeFromCart(item._id)} className="p-1 text-red-500 hover:text-red-700 ml-1">
//                                         <Trash2 size={16} />
//                                     </button>
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>

//                 <div className="p-4 bg-gray-50 border-t space-y-2">
//                     <div className="flex justify-between text-sm">
//                         <span>Subtotal</span>
//                         <span>Rs {subtotal}</span>
//                     </div>
//                     <div className="flex justify-between text-sm items-center">
//                         <span>Discount</span>
//                         <input
//                             type="number"
//                             className="w-16 p-1 text-right text-xs border rounded"
//                             value={discount}
//                             onChange={(e) => setDiscount(Number(e.target.value))}
//                         />
//                     </div>
//                     <div className="flex justify-between font-bold text-lg pt-2 border-t text-indigo-700">
//                         <span>Total</span>
//                         <span>Rs {total}</span>
//                     </div>

//                     <button
//                         onClick={() => setIsCheckoutOpen(true)}
//                         disabled={cart.length === 0}
//                         className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-md font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
//                     >
//                         Place Order (Rs {total})
//                     </button>
//                 </div>
//             </div>

//             <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Checkout">
//                 <div className="space-y-4">
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer (Optional)</label>
//                         <select
//                             className="block w-full border border-gray-300 rounded-md p-2"
//                             onChange={(e) => {
//                                 const cust = customers.find(c => c._id === e.target.value);
//                                 setSelectedCustomer(cust);
//                             }}
//                         >
//                             <option value="">Walk-in Customer</option>
//                             {customers.map(c => (
//                                 <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
//                             ))}
//                         </select>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
//                         <select
//                             className="block w-full border border-gray-300 rounded-md p-2"
//                             value={paymentMethod}
//                             onChange={(e) => setPaymentMethod(e.target.value)}
//                         >
//                             <option value="Cash">Cash</option>
//                             <option value="Card">Card</option>
//                             <option value="Online">Online</option>
//                         </select>
//                     </div>

//                     <div className="bg-gray-100 p-4 rounded-md">
//                         <div className="flex justify-between font-bold">
//                             <span>Total Payable:</span>
//                             <span>Rs {total}</span>
//                         </div>
//                     </div>

//                     <button
//                         onClick={handleCheckout}
//                         className="w-full bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 mt-4"
//                     >
//                         Confirm Payment
//                     </button>
//                 </div>
//             </Modal>

//             {/* Hidden Invoice Component for Printing */}
//             <div className="hidden">
//                 <Invoice
//                     ref={componentRef}
//                     cart={cart}
//                     total={total}
//                     tax={taxAmount}
//                     discount={discount}
//                     customer={selectedCustomer}
//                     user={user}
//                     date={new Date().toLocaleDateString()}
//                 />
//             </div>
//         </div>
//     );
// };

// export default POS;




import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Invoice from '../components/Invoice';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

// THEME FIX NOTES:
// 1) Removed hard-coded light colors (bg-white, text-gray-800, etc.) where possible
// 2) Added Tailwind dark: variants everywhere
// 3) Avoided inline colors; rely on semantic utility classes
// 4) Works when Tailwind dark mode is set to 'class'

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
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const handleCheckout = async () => {
    try {
      // Basic validations
      if (!cart || cart.length === 0) {
        alert('Cart is empty');
        return;
      }

      // Validation: credit sales must have a customer
      if (paymentMethod === 'Credit' && !selectedCustomer) {
        alert('Please select a customer to record a credit sale.');
        return;
      }

      const paidAmount = paymentMethod === 'Credit' ? 0 : total;

      // Idempotency key to prevent duplicate server-side ledger/order duplication on retries
      const idempotencyKey = `ORDER:${Date.now()}:${Math.random().toString(36).slice(2,10)}`;

      const orderData = {
        orderItems: cart.map(item => ({
          product: item._id,
          name: item.name,
          qty: item.qty,
          price: item.price
        })),
        paymentMethod,
        totalAmount: total,
        taxAmount,
        discountAmount: discount,
        customerId: selectedCustomer ? selectedCustomer._id : null,
        paidAmount,
        idempotencyKey,
      };

      await api.post('/orders', orderData);
      fetchProducts();

      if (window.confirm('Order Successful! Do you want to print the invoice?')) {
        handlePrint();
      }

      setCart([]);
      setIsCheckoutOpen(false);
      setDiscount(0);
      setSelectedCustomer(null);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || 'Order Failed');
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
                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}
                >
                  {product.stock}
                </span>
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
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-16 p-1 text-right rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500"
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
          <select
            className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
            onChange={(e) => setSelectedCustomer(customers.find(c => c._id === e.target.value))}
          >
            <option value="">Walk-in Customer</option>
            {customers.map(c => (
              <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
            ))}
          </select>

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

          {paymentMethod === 'Credit' && !selectedCustomer && (
            <div className="text-sm text-red-500 mt-2">Please select a customer to record credit sales.</div>
          )}

          <button
            onClick={handleCheckout}
            disabled={paymentMethod === 'Credit' && !selectedCustomer}
            className={`w-full py-3 rounded-md font-bold text-white ${paymentMethod === 'Credit' && !selectedCustomer ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 dark:bg-green-700'}`}
          >
            {paymentMethod === 'Credit' ? `Record Credit (Rs ${total})` : 'Confirm Payment'}
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
