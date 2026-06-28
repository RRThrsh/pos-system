import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import Login from './pages/auth/Login.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import AuditLogs from './pages/dashboard/AuditLogs.jsx'
import Config from './pages/dashboard/Config.jsx'
import Permissions from './pages/dashboard/Permissions.jsx'
import Monitoring from './pages/dashboard/Monitoring.jsx'
import Snapshots from './pages/dashboard/Snapshots.jsx'
import Analytics from './pages/dashboard/Analytics.jsx'
import Products from './pages/dashboard/Products.jsx'
import Categories from './pages/dashboard/Categories.jsx'
import Pos from './pages/cashier/Pos.jsx'
import SalesHistory from './pages/dashboard/SalesHistory.jsx'
import Inventory from './pages/dashboard/Inventory.jsx'
import Reports from './pages/dashboard/Reports.jsx'
import Users from './pages/dashboard/Users.jsx'
import Suppliers from './pages/dashboard/Suppliers.jsx'
import Returns from './pages/dashboard/Returns.jsx'
import Tables from './pages/dashboard/Tables.jsx'
import PurchaseOrders from './pages/dashboard/PurchaseOrders.jsx'
import Expenses from './pages/dashboard/Expenses.jsx'
import PromoCodes from './pages/dashboard/PromoCodes.jsx'
import Customers from './pages/dashboard/Customers.jsx'
import StockCounts from './pages/dashboard/StockCounts.jsx'
import RegisterAccount from './pages/dashboard/RegisterAccount.jsx'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/pos" element={<Pos />} />
              <Route path="/dashboard/products" element={<Products />} />
              <Route path="/dashboard/categories" element={<Categories />} />
              <Route path="/dashboard/sales" element={<SalesHistory />} />
              <Route path="/dashboard/inventory" element={<Inventory />} />
              <Route path="/dashboard/reports" element={<Reports />} />
              <Route path="/dashboard/users" element={<Users />} />
              <Route path="/dashboard/suppliers" element={<Suppliers />} />
              <Route path="/dashboard/returns" element={<Returns />} />
              <Route path="/dashboard/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/dashboard/expenses" element={<Expenses />} />
              <Route path="/dashboard/audit-logs" element={<AuditLogs />} />
              <Route path="/dashboard/config" element={<Config />} />
              <Route path="/dashboard/permissions" element={<Permissions />} />
              <Route path="/dashboard/promo-codes" element={<PromoCodes />} />
              <Route path="/dashboard/monitoring" element={<Monitoring />} />
              <Route path="/dashboard/snapshots" element={<Snapshots />} />
              <Route path="/dashboard/analytics" element={<Analytics />} />
              <Route path="/dashboard/customers" element={<Customers />} />
              <Route path="/dashboard/stock-counts" element={<StockCounts />} />
              <Route path="/dashboard/tables" element={<Tables />} />
              <Route path="/dashboard/register" element={<RegisterAccount />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
