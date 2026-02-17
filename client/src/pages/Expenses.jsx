import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { Plus, Trash2, Receipt } from 'lucide-react';
import Modal from '../components/Modal';

import { useAuth } from '../context/AuthContext';

const Expenses = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [expenseSummary, setExpenseSummary] = useState({ summary: [], totalExpenses: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ category: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchExpenses();
        fetchExpenseSummary();
    }, []);

    const fetchExpenses = async () => {
        try {
            const { data } = await api.get('/expenses');
            setExpenses(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchExpenseSummary = async () => {
        try {
            const { data } = await api.get('/expenses/summary/category');
            setExpenseSummary(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/expenses', formData);
            setExpenses([data, ...expenses]);
            fetchExpenseSummary();
            setIsModalOpen(false);
            setFormData({ category: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error(error);
            alert('Failed to add expense');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this expense?')) {
            try {
                await api.delete(`/expenses/${id}`);
                setExpenses(expenses.filter(e => e._id !== id));
                fetchExpenseSummary();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('expenses')}</h1>
                    <p className="text-gray-500 dark:text-gray-400">Total: Rs {totalExpenses.toLocaleString()}</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        <Plus size={20} className="mr-2" />
                        {t('add_expense')}
                    </button>
                )}
            </div>

            {/* Expense Summary by Category */}
            {expenseSummary.summary.length > 0 && (
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center">
                            <Receipt size={20} className="mr-2" />
                            Expense Summary by Category
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Count</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Average</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {expenseSummary.summary.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item._id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.count}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">Rs {item.totalAmount.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Rs {Math.round(item.avgAmount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
  <thead className="bg-gray-50 dark:bg-gray-700">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        {t('date')}
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        Category
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        Note
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        Amount
      </th>
      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        {t('action')}
      </th>
    </tr>
  </thead>
  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    {expenses.length > 0 ? (
      expenses.map((expense) => (
        <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {new Date(expense.date).toLocaleDateString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {expense.category}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {expense.note}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">
            Rs {expense.amount}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            {user?.role === 'admin' && (
              <button
                onClick={() => handleDelete(expense._id)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
              >
                <Trash2 size={18} />
              </button>
            )}
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="5" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
          No expenses found.
        </td>
      </tr>
    )}
  </tbody>
</table>

            </div>

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Add Expense"
>
  <form onSubmit={handleSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
      <select
        required
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2"
      >
        <option value="">Select Category</option>
        <option value="Rent">Rent</option>
        <option value="Electricity">Electricity</option>
        <option value="Salaries">Salaries</option>
        <option value="Maintenance">Maintenance</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (Rs)</label>
      <input
        type="number"
        required
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
      <input
        type="text"
        value={formData.note}
        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
      <input
        type="date"
        required
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2"
      />
    </div>

    <div className="flex justify-end pt-4">
      <button
        type="button"
        onClick={() => setIsModalOpen(false)}
        className="mr-3 text-gray-700 dark:text-gray-300"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2 rounded-md"
      >
        Save
      </button>
    </div>
  </form>
</Modal>

        </div>
    );
};

export default Expenses;
