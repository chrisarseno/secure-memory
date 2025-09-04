import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import ConsciousnessCore from "@/pages/consciousness-core";
import KnowledgeGraph from "@/pages/knowledge-graph";
import SocialCognition from "@/pages/social-cognition";
import TemporalAwareness from "@/pages/temporal-awareness";
import CreativeIntelligence from "@/pages/creative-intelligence";
import ValueSystem from "@/pages/value-system";
import SafetyMonitor from "@/pages/safety-monitor";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Initializing NEXUS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Switch>
        {!isAuthenticated ? (
          <>
            <Route path="/login" component={LoginPage} />
            <Route path="/" component={LandingPage} />
            <Route component={LandingPage} />
          </>
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/consciousness-core" component={ConsciousnessCore} />
            <Route path="/knowledge-graph" component={KnowledgeGraph} />
            <Route path="/social-cognition" component={SocialCognition} />
            <Route path="/temporal-awareness" component={TemporalAwareness} />
            <Route path="/creative-intelligence" component={CreativeIntelligence} />
            <Route path="/value-system" component={ValueSystem} />
            <Route path="/safety-monitor" component={SafetyMonitor} />
            <Route component={NotFound} />
          </>
        )}
      </Switch>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
