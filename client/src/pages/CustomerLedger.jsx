import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import Modal from '../components/Modal';
import { useReactToPrint } from 'react-to-print';

const CustomerLedger = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState([]); // raw ledger from server
  const [filteredLedger, setFilteredLedger] = useState([]); // visible rows
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const printAllRef = useRef();
  const printFilteredRef = useRef();

  const handlePrintAll = useReactToPrint({ content: () => printAllRef.current });
  const handlePrintFiltered = useReactToPrint({ content: () => printFilteredRef.current });

  // 🔹 fetchLedger function
  const fetchLedger = async () => {
    try {
      const response = await api.get(`/customers/${id}/ledger`);

      // Response: { customer, ledger: [{ date, description, amount, items... }, ...] }
      setCustomer(response.data.customer);

      // Normalize entries so UI can handle both legacy and new shapes
      const normalized = (response.data.ledger || []).map((entry) => ({
        _id: entry._id || entry.orderId || `${entry.type}-${Math.random()}`,
        date: entry.date || entry.createdAt,
        description: entry.description || entry.note || '',
        amount: Number(entry.amount || 0),
        paymentMethod: entry.paymentMethod || null,
        items: entry.items || []
      }));

      setLedgerData(normalized);
      // apply current filter immediately
      const pm = selectedPaymentMethod;
      setFilteredLedger(pm === 'All' ? normalized : normalized.filter(e => e.paymentMethod === pm));
    } catch (error) {
      console.error('Ledger Error:', error.response?.data || error.message);
      setCustomer(null);
      setLedger([]);
    }
  };

  // 🔹 useEffect me safe call
  useEffect(() => {
    fetchLedger();

    // auto-refresh when POS creates an order for this customer
    const handler = (e) => {
      try {
        const createdOrder = e.detail;
        const orderCustomerId = createdOrder?.customer?._id || createdOrder?.customer;
        if (orderCustomerId && String(orderCustomerId) === String(id)) {
          fetchLedger();
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('pos:orderCreated', handler);
    return () => window.removeEventListener('pos:orderCreated', handler);
  }, [id, selectedPaymentMethod]); // refresh when id or selectedPaymentMethod changes

  const handleClearPayment = async () => {
    try {
      await api.post(`/customers/${id}/clear`, { amount: paymentAmount, paymentMethod });
      setIsModalOpen(false);
      setPaymentAmount(0);
      fetchLedger(); // refresh ledger after payment
    } catch (error) {
      console.error(error);
      alert('Payment failed');
    }
  };

  // Filter handling (calls server with paymentMethod query for authoritative data)
  const onFilter = async (pm) => {
    setSelectedPaymentMethod(pm);
    try {
      if (pm === 'All') {
        await fetchLedger();
        return;
      }
      const res = await api.get(`/customers/${id}/ledger?paymentMethod=${pm}`);
      const normalized = (res.data.ledger || []).map((entry) => ({
        _id: entry._id,
        date: entry.date || entry.createdAt,
        description: entry.description || entry.note || '',
        amount: Number(entry.amount || 0),
        paymentMethod: entry.paymentMethod || null,
        items: entry.items || []
      }));
      setLedgerData(normalized);
      setFilteredLedger(normalized);
    } catch (err) {
      console.error(err);
    }
  };

  // derive filteredLedger when ledgerData or selectedPaymentMethod changes (fallback client-side)
  useEffect(() => {
    if (selectedPaymentMethod === 'All') {
      setFilteredLedger(ledgerData);
    } else {
      setFilteredLedger(ledgerData.filter(e => e.paymentMethod === selectedPaymentMethod));
    }
  }, [ledgerData, selectedPaymentMethod]);

  if (!customer) return <div>Loading...</div>;

  return (
    <div className="p-6">
      {/* Header + Balance + Clear Payment */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{customer.name} - Ledger</h1>
          <div className="text-sm text-gray-500 mt-1">Customer ID: {customer._id}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded ${customer.balance >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            Balance: Rs {Number(customer.balance).toFixed(2)}
          </div>

          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            Clear Payment
          </button>
        </div>
      </div>

      {/* Toolbar: filters + print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {['All','Cash','Card','Online','Credit'].map((pm) => (
            <button
              key={pm}
              onClick={() => onFilter(pm)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${selectedPaymentMethod === pm ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}
            >
              {pm}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrintAll} className="px-3 py-1 bg-gray-800 text-white rounded text-sm">Print All</button>
          <button onClick={handlePrintFiltered} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Print Filtered</button>
          <button onClick={() => fetchLedger()} className="px-3 py-1 bg-white border rounded text-sm">Refresh</button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date / Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description / Products</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Payment Method</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLedger.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No transactions yet</td>
              </tr>
            )}

            {filteredLedger.map((entry) => {
              const when = entry.date || entry.createdAt;
              const desc = entry.description || entry.note || '';
              const items = entry.items || [];
              const pm = entry.paymentMethod || (desc.match(/via (Cash|Card|Online|Credit)/i) || [])[1] || '—';
              return (
                <tr key={entry._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(when).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="font-medium">{desc}</div>
                    {items.length > 0 && (
                      <ul className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {items.map((item, idx) => (
                          <li key={idx} className="leading-tight">
                            {item.name} <span className="text-gray-400">x</span> {item.qty} <span className="text-gray-400">@ Rs</span> {item.price} <span className="text-gray-400">(Total: Rs { (item.price * item.qty).toFixed(2) })</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-left">
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">{pm}</span>
                  </td>

                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${entry.amount < 0 ? 'text-red-700' : 'text-green-700'}`}>
                    Rs {entry.amount.toFixed(2)}
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            {filteredLedger.length > 0 && (
              <tr className="border-t">
                <td />
                <td />
                <td className="px-6 py-3 text-right font-bold text-sm text-gray-700 dark:text-gray-200">Total</td>
                <td className="px-6 py-3 text-right font-bold text-sm text-gray-700 dark:text-gray-200">Rs {filteredLedger.reduce((s, e) => s + Number(e.amount || 0), 0).toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hidden printable copies */}
      <div style={{ display: 'none' }}>
        <div ref={printAllRef} className="p-6 bg-white text-black">
          <h2 className="text-xl font-bold">{customer.name} — Full Ledger</h2>
          <div className="text-sm mt-2">Printed: {new Date().toLocaleString()}</div>
          <table className="w-full mt-4 text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left">Date</th>
                <th className="text-left">Description / Products</th>
                <th className="text-left">Payment</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map(e => (
                <tr key={e._id}>
                  <td>{new Date(e.date).toLocaleString()}</td>
                  <td>{e.description || e.note}</td>
                  <td>{e.paymentMethod || '—'}</td>
                  <td style={{ textAlign: 'right' }}>Rs {Number(e.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td />
                <td className="font-bold">Total</td>
                <td className="font-bold text-right">Rs {ledgerData.reduce((s, x) => s + Number(x.amount || 0), 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div ref={printFilteredRef} className="p-6 bg-white text-black">
          <h2 className="text-xl font-bold">{customer.name} — Ledger ({selectedPaymentMethod})</h2>
          <div className="text-sm mt-2">Printed: {new Date().toLocaleString()}</div>
          <table className="w-full mt-4 text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left">Date</th>
                <th className="text-left">Description / Products</th>
                <th className="text-left">Payment</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.map(e => (
                <tr key={e._id}>
                  <td>{new Date(e.date).toLocaleString()}</td>
                  <td>{e.description || e.note}</td>
                  <td>{e.paymentMethod || '—'}</td>
                  <td style={{ textAlign: 'right' }}>Rs {Number(e.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td />
                <td className="font-bold">Total</td>
                <td className="font-bold text-right">Rs {filteredLedger.reduce((s, x) => s + Number(x.amount || 0), 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Clear Payment">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Online">Online</option>
            </select>
          </div>
          <button
            onClick={handleClearPayment}
            className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Submit Payment
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerLedger;
