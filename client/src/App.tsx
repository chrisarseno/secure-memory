import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import ConsciousnessCore from "@/pages/consciousness-core";
import KnowledgeGraph from "@/pages/knowledge-graph";
import SocialCognition from "@/pages/social-cognition";
import TemporalAwareness from "@/pages/temporal-awareness";
import CreativeIntelligence from "@/pages/creative-intelligence";
import ValueSystem from "@/pages/value-system";
import SafetyMonitor from "@/pages/safety-monitor";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Switch>
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
        </Switch>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
