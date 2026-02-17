// import React, { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import api from '../utils/api';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp } from 'lucide-react';

// const Dashboard = () => {
//     const { t } = useTranslation();
//     const [stats, setStats] = useState({
//         totalSales: 0,
//         totalOrders: 0,
//         lowStockCount: 0,
//         estimatedProfit: 0,
//         recentOrders: [],
//     });
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchDashboardData = async () => {
//             try {
//                 const [summaryRes, recentOrdersRes] = await Promise.all([
//                     api.get('/dashboard/summary'),
//                     api.get('/orders') // Still fetching full orders for the table/chart, could optimize later
//                 ]);

//                 const summary = summaryRes.data;
//                 const orders = recentOrdersRes.data;

//                 // Chart data (mocked for now as backend doesn't return daily yet, or we can aggregate frontend)
//                 // Leaving chart logic as is for now or processing 'orders' array if needed.

//                 setStats({
//                     totalSales: summary.totalSales,
//                     totalOrders: summary.totalOrders,
//                     lowStockCount: summary.lowStockCount,
//                     estimatedProfit: summary.estimatedProfit,
//                     recentOrders: orders.slice(0, 5),
//                 });
//             } catch (error) {
//                 console.error("Error fetching dashboard data", error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchDashboardData();
//     }, []);

//     const data = [
//         { name: 'Mon', sales: 4000 },
//         { name: 'Tue', sales: 3000 },
//         { name: 'Wed', sales: 2000 },
//         { name: 'Thu', sales: 2780 },
//         { name: 'Fri', sales: 1890 },
//         { name: 'Sat', sales: 2390 },
//         { name: 'Sun', sales: 3490 },
//     ];

//     if (loading) return <div className="p-4">Loading...</div>;

//     const StatCard = ({ title, value, icon: Icon, color }) => (
//         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
//             <div className={`p-3 rounded-full ${color} text-white mr-4`}>
//                 <Icon size={30} />
//             </div>
//             <div>
//                 <p className="text-gray-500 text-sm">{title}</p>
//                 <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
//             </div>
//         </div>
//     );

//     return (
//         <div className="space-y-6">
//             <h1 className="text-2xl font-bold text-gray-800">{t('dashboard')}</h1>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                 <StatCard
//                     title={t('total_sales')}
//                     value={`Rs ${stats.totalSales.toLocaleString()}`}
//                     icon={DollarSign}
//                     color="bg-green-500"
//                 />
//                 <StatCard
//                     title={t('total_orders')}
//                     value={stats.totalOrders}
//                     icon={ShoppingBag}
//                     color="bg-blue-500"
//                 />
//                 <StatCard
//                     title={t('low_stock')}
//                     value={stats.lowStockCount}
//                     icon={AlertTriangle}
//                     color="bg-yellow-500"
//                 />
//                 <StatCard
//                     title="Estimated Profit"
//                     value={`Rs ${stats.estimatedProfit.toLocaleString()}`}
//                     icon={TrendingUp}
//                     color="bg-purple-500"
//                 />
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {/* Chart */}
//                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//                     <h3 className="text-lg font-semibold mb-4 text-gray-700">Weekly Sales</h3>
//                     <div className="h-80">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <BarChart data={data}>
//                                 <CartesianGrid strokeDasharray="3 3" />
//                                 <XAxis dataKey="name" />
//                                 <YAxis />
//                                 <Tooltip />
//                                 <Legend />
//                                 <Bar dataKey="sales" fill="#4F46E5" />
//                             </BarChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>

//                 {/* Recent Orders */}
//                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//                     <h3 className="text-lg font-semibold mb-4 text-gray-700">Recent Orders</h3>
//                     <div className="overflow-x-auto">
//                         <table className="min-w-full divide-y divide-gray-200">
//                             <thead className="bg-gray-50">
//                                 <tr>
//                                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
//                                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//                                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="bg-white divide-y divide-gray-200">
//                                 {stats.recentOrders.map((order) => (
//                                     <tr key={order._id}>
//                                         <td className="px-4 py-3 text-sm text-gray-900">#{order._id.substring(20, 24)}</td>
//                                         <td className="px-4 py-3 text-sm text-gray-900">Rs {order.totalAmount}</td>
//                                         <td className="px-4 py-3">
//                                             <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//                                                 Paid
//                                             </span>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Dashboard;



import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        lowStockCount: 0,
        grossProfit: 0,
        netProfit: 0,
        totalExpenses: 0,
        recentOrders: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryRes, recentOrdersRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/orders')
                ]);

                const summary = summaryRes.data;
                const orders = recentOrdersRes.data;

                setStats({
                    totalSales: summary.totalSales,
                    totalOrders: summary.totalOrders,
                    lowStockCount: summary.lowStockCount,
                    grossProfit: summary.grossProfit,
                    netProfit: summary.netProfit,
                    totalExpenses: summary.totalExpenses,
                    recentOrders: orders.slice(0, 5),
                });
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const data = [
        { name: 'Mon', sales: 4000 },
        { name: 'Tue', sales: 3000 },
        { name: 'Wed', sales: 2000 },
        { name: 'Thu', sales: 2780 },
        { name: 'Fri', sales: 1890 },
        { name: 'Sat', sales: 2390 },
        { name: 'Sun', sales: 3490 },
    ];

    if (loading) return <div className="p-4 text-gray-700 dark:text-gray-200">Loading...</div>;

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="flex items-center p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700
                        bg-white dark:bg-gray-800">
            <div className={`p-3 rounded-full ${color} text-white mr-4`}>
                <Icon size={30} />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</h3>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('dashboard')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    title={t('total_sales')}
                    value={`Rs ${stats.totalSales.toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-green-500"
                />
                <StatCard
                    title={t('total_orders')}
                    value={stats.totalOrders}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                />
                <StatCard
                    title={t('low_stock')}
                    value={stats.lowStockCount}
                    icon={AlertTriangle}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Gross Profit"
                    value={`Rs ${(stats.grossProfit || 0).toLocaleString()}`}
                    icon={TrendingUp}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Net Profit"
                    value={`Rs ${(stats.netProfit || 0).toLocaleString()}`}
                    icon={TrendingUp}
                    color="bg-indigo-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">{t('weekly_sales')}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                                <XAxis dataKey="name" stroke={theme === 'dark' ? '#D1D5DB' : '#6B7280'} />
                                <YAxis stroke={theme === 'dark' ? '#D1D5DB' : '#6B7280'} />
                                <Tooltip wrapperStyle={{ color: theme === 'dark' ? '#111827' : '#000' }} />
                                <Legend />
                                <Bar dataKey="sales" fill="#4F46E5" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">{t('recent_orders')}</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {stats.recentOrders.map((order) => (
                                    <tr key={order._id}>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">#{order._id.substring(20, 24)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Rs {order.totalAmount}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                                                Paid
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
