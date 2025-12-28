import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Receipt,
    Settings,
    LogOut,
    Menu,
    X,
    BarChart3
} from 'lucide-react';

const MainLayout = () => {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Handle RTL
    useEffect(() => {
        const dir = i18n.language === 'ur' || i18n.language === 'sd' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('i18nextLng', lng);
    };

    const allMenuItems = [
        { path: '/', icon: LayoutDashboard, label: 'dashboard', roles: ['admin'] },
        { path: '/pos', icon: ShoppingCart, label: 'sales', roles: ['admin', 'staff'] },
        { path: '/products', icon: Package, label: 'products', roles: ['admin', 'staff'] }, // Staff can view, but not edit (handled in page)
        { path: '/customers', icon: Users, label: 'customers', roles: ['admin', 'staff'] }, // Staff can view, but not edit (handled in page)
        { path: '/expenses', icon: Receipt, label: 'expenses', roles: ['admin'] },
        { path: '/reports', icon: BarChart3, label: 'reports', roles: ['admin'] },
        { path: '/settings', icon: Settings, label: 'settings', roles: ['admin'] },
    ];

    const menuItems = allMenuItems.filter(item => item.roles.includes(user?.role));

    return (
        <div className={`min-h-screen bg-gray-100 flex ${i18n.language === 'ur' || i18n.language === 'sd' ? 'font-urdu' : 'font-sans'}`}>
            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : (i18n.dir() === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
                    ${i18n.dir() === 'rtl' ? 'right-0' : 'left-0'}
                `}
            >
                <div className="h-16 flex items-center justify-between px-4 bg-slate-950">
                    <h1 className="text-xl font-bold tracking-wider">POS SYSTEM</h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
                        <X size={24} />
                    </button>
                </div>

                <nav className="mt-4 px-2 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                                ${location.pathname === item.path
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                            `}
                        >
                            <item.icon className={`h-5 w-5 ${i18n.dir() === 'rtl' ? 'ml-3' : 'mr-3'}`} />
                            {t(item.label)}
                        </Link>
                    ))}
                    <button
                        onClick={logout}
                        className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-400 rounded-md hover:bg-slate-800 hover:text-red-300 transition-colors mt-8"
                    >
                        <LogOut className={`h-5 w-5 ${i18n.dir() === 'rtl' ? 'ml-3' : 'mr-3'}`} />
                        {t('logout')}
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? (i18n.dir() === 'rtl' ? 'mr-64' : 'ml-64') : ''}`}>

                {/* Topbar */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-6 z-40 sticky top-0">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        >
                            {theme === 'dark' ? '🌞' : '🌙'}
                        </button>

                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mx-2">
                            {t('welcome')}, {user?.name}
                        </span>

                        <div className="relative">
                            <button
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400 focus:outline-none"
                            >
                                <span>🌐 {i18n.language.toUpperCase()}</span>
                            </button>
                            {isLangMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg z-50">
                                    <button onClick={() => { changeLanguage('en'); setIsLangMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-gray-200">English</button>
                                    <button onClick={() => { changeLanguage('ur'); setIsLangMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-urdu dark:text-gray-200">اردو</button>
                                    <button onClick={() => { changeLanguage('sd'); setIsLangMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-sindhi dark:text-gray-200">سنڌي</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
