// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import { useAuth } from './context/AuthContext';
// import MainLayout from './layouts/MainLayout';
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import POS from './pages/POS';
// import Products from './pages/Products';
// import Customers from './pages/Customers';
// import Expenses from './pages/Expenses';
// import Reports from './pages/Reports';
// import Settings from './pages/Settings';
// import { ThemeProvider } from './context/ThemeContext';

// const ProtectedRoute = ({ children }) => {
//     const { user, loading } = useAuth();
//     if (loading) return <div>Loading...</div>;
//     return user ? children : <Navigate to="/login" />;
// };

// const DashboardRedirect = () => {
//     const { user } = useAuth();
//     if (user?.role === 'staff') {
//         return <Navigate to="/pos" replace />;
//     }
//     return <Dashboard />;
// };

// function App() {
//     return (
//         <ThemeProvider>
//         <Routes>
//             <Route path="/login" element={<Login />} />

//             <Route path="/" element={
//                 <ProtectedRoute>
//                     <MainLayout />
//                 </ProtectedRoute>
//             }>
//                 <Route index element={
//                     <ProtectedRoute>
//                         <DashboardRedirect />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="pos" element={<POS />} />
//                 <Route path="products" element={<Products />} />
//                 <Route path="customers" element={<Customers />} />
//                 <Route path="expenses" element={<Expenses />} />
//                 <Route path="reports" element={<Reports />} />
//                 <Route path="settings" element={<Settings />} />
//             </Route>

//             <Route path="*" element={<Navigate to="/" />} />
//         </Routes>
//         </ThemeProvider>
//     );
// }

// export default App;


import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import CustomerLedger from './pages/CustomerLedger';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'staff') return <Navigate to="/pos" replace />;
  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes with MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard / Home */}
          <Route
            index
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* Other Pages */}
          <Route path="pos" element={<POS />} />
          <Route path="products" element={<Products />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id/ledger" element={<CustomerLedger />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
