import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clientes from "@/pages/clientes";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Members from "@/pages/members";
import Administrador from "@/pages/administrador";
import ApkGenerator from "@/pages/apk-generator";

const queryClient = new QueryClient();

function ProtectedRoute({
  component: Component,
  adminOnly = false,
}: {
  component: React.ComponentType;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#000",
          color: "#00ff88",
          fontFamily: "monospace",
          fontSize: 12,
          letterSpacing: "0.15em",
        }}
      >
        &gt; AUTENTICANDO...
        <span
          style={{
            display: "inline-block",
            marginLeft: 4,
            animation: "blink 1s step-end infinite",
          }}
        >
          _
        </span>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.status !== "approved")) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/clientes">
        <ProtectedRoute component={Clientes} />
      </Route>
      <Route path="/members">
        <ProtectedRoute component={Members} adminOnly />
      </Route>
      <Route path="/administrador">
        <ProtectedRoute component={Administrador} adminOnly />
      </Route>
      <Route path="/apk-generator">
        <ProtectedRoute component={ApkGenerator} adminOnly />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
