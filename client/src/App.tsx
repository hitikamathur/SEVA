import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import Find from "@/pages/Find";
import Track from "@/pages/Track";
import FirstAid from "@/pages/FirstAid";
import Hospitals from "@/pages/Hospitals";
import Driver from "@/pages/Driver";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/find" component={Find} />
      <Route path="/track" component={Track} />
      <Route path="/firstaid" component={FirstAid} />
      <Route path="/hospitals" component={Hospitals} />
      <Route path="/driver" component={Driver} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
