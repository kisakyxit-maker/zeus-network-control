import { Switch, Route, Redirect } from "wouter";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/auth";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomCursor } from "@/components/custom-cursor";
import type { ComponentType } from "react";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Devices from "@/pages/devices";
import DeviceDetail from "@/pages/device-detail";
import Clientes from "@/pages/clientes";
import Administrador from "@/pages/administrador";
import Members from "@/pages/members";
import Meeting from "@/pages/meeting";
import ApkGenerator from "@/pages/apk-generator";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || user.status !== "approved") return <Redirect to="/login" />;
  return <Component />;
}

function AdminRoute({ component: Component }: { component: ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || user.status !== "approved" || user.role !== "admin") return <Redirect to="/login" />;
  return <Component />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router base={basePath}>
            <Switch>
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
              <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
              <Route path="/devices">{() => <ProtectedRoute component={Devices} />}</Route>
              <Route path="/devices/:id">{() => <ProtectedRoute component={DeviceDetail} />}</Route>
              <Route path="/clientes">{() => <ProtectedRoute component={Clientes} />}</Route>
              <Route path="/meeting">{() => <ProtectedRoute component={Meeting} />}</Route>
              <Route path="/apk-generator">{() => <AdminRoute component={ApkGenerator} />}</Route>
              <Route path="/administrador">{() => <AdminRoute component={Administrador} />}</Route>
              <Route path="/members">{() => <AdminRoute component={Members} />}</Route>
              <Route component={NotFound} />
            </Switch>
          </Router>
          <Toaster />
          <CustomCursor />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
