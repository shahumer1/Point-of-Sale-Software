import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import Modal from '../components/Modal';

const CustomerLedger = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const { data } = await api.get(`/customers/${id}/ledger`);
      setCustomer(data.customer);
      setLedger(data.ledger);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClearPayment = async () => {
    try {
      await api.post(`/customers/${id}/clear`, { amount: paymentAmount, paymentMethod });
      setIsModalOpen(false);
      setPaymentAmount(0);
      fetchLedger();
    } catch (error) {
      console.error(error);
      alert('Payment failed');
    }
  };

  if (!customer) return <div>Loading...</div>;

  return (
    <div className="p-6">
      {/* Header + Balance + Clear Payment */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{customer.name} - Ledger</h1>
        <div className={`px-4 py-2 rounded ${customer.balance >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          Balance: Rs {customer.balance}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Clear Payment
        </button>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description / Products</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {ledger.map(entry => (
              <tr key={entry._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  <div className="font-medium">{entry.note}</div>
                  {entry.items && entry.items.length > 0 && (
                    <ul className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {entry.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} x {item.qty} @ Rs {item.price}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>

                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${entry.amount >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                  Rs {entry.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
