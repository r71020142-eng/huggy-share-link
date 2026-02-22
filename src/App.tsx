import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StoreProvider } from "@/hooks/useStore";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/admin/Dashboard";
import Orders from "@/pages/admin/Orders";
import Menus from "@/pages/admin/Menus";
import MenuEditor from "@/pages/admin/MenuEditor";
import CardapioEditor from "@/pages/admin/CardapioEditor";
import Categories from "@/pages/admin/Categories";
import Products from "@/pages/admin/Products";
import CRM from "@/pages/admin/CRM";
import Reports from "@/pages/admin/Reports";
import Settings from "@/pages/admin/Settings";
import Plans from "@/pages/admin/Plans";
import Neighborhoods from "@/pages/admin/Neighborhoods";
import SuperAdminDashboard from "@/pages/superadmin/Dashboard";
import SuperAdminKeys from "@/pages/superadmin/Keys";
import SuperAdminStores from "@/pages/superadmin/Stores";
import PublicMenu from "@/pages/public/PublicMenu";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (user) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/m/:slug" element={<PublicMenu />} />
              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="menus" element={<Menus />} />
                <Route path="menus/:menuId/editor" element={<MenuEditor />} />
                <Route path="menus/:menuId" element={<CardapioEditor />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
                <Route path="neighborhoods" element={<Neighborhoods />} />
                <Route path="crm" element={<CRM />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="plans" element={<Plans />} />
              </Route>
              <Route path="/superadmin" element={<SuperAdminLayout />}>
                <Route index element={<SuperAdminDashboard />} />
                <Route path="keys" element={<SuperAdminKeys />} />
                <Route path="stores" element={<SuperAdminStores />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
