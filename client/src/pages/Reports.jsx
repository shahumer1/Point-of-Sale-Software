import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';
import { Calendar, DollarSign, TrendingUp, ShoppingBag, Loader, Receipt } from 'lucide-react';

const Reports = () => {
  const { t } = useTranslation();

  // Function to get today's date in YYYY-MM-DD format (local time)
  const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // months 0-based
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/reports/sales?startDate=${startDate}&endDate=${endDate}`
      );
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch report', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center">
      <div className={`p-3 rounded-full ${color} text-white mr-4`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Sales Report</h1>

        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchReport}
            className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 dark:bg-indigo-700 text-white"
          >
            {loading ? <Loader className="animate-spin h-4 w-4 mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
            Generate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`Rs ${reportData?.summary.totalSales?.toLocaleString() || 0}`} icon={DollarSign} color="bg-green-600" />
        <StatCard title="Gross Profit" value={`Rs ${reportData?.summary.grossProfit?.toLocaleString() || 0}`} icon={TrendingUp} color="bg-purple-600" />
        <StatCard title="Total Expenses" value={`Rs ${reportData?.summary.totalExpenses?.toLocaleString() || 0}`} icon={Receipt} color="bg-orange-600" />
        <StatCard title="Net Profit" value={`Rs ${reportData?.summary.netProfit?.toLocaleString() || 0}`} icon={TrendingUp} color="${reportData?.summary.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600'}" />
      </div>

      {/* Expense Breakdown by Category */}
      {reportData?.expenseBreakdown?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-700 dark:text-gray-200">Expense Breakdown by Category</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr className="text-xs uppercase text-gray-500 dark:text-gray-300">
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-right">Count</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.expenseBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{item._id}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">{item.count}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-red-600 dark:text-red-400">Rs {item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-700 dark:text-gray-200">Detailed Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr className="text-xs uppercase text-gray-500 dark:text-gray-300">
                <th className="px-6 py-3 text-left">Order ID</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Payment</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reportData?.orders?.length > 0 ? reportData.orders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">#{order._id.substring(20, 24)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {order.customer ? order.customer.name : 'Walk-in'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-gray-100">Rs {order.totalAmount}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-green-600 dark:text-green-400">Rs {order.profit}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No sales found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
