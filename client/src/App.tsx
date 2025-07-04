import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useLanguage } from "./hooks/use-language";
import Loader from "./components/ui/Loader";
import Header from "./components/layout/Header";
import { useEffect, useState } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { direction } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Google Analytics when app loads
    initGA();

    // Simulate loading - reduced for debugging
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`${direction} min-h-screen`}>
      <TooltipProvider>
        <Toaster />
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <Header />
            <Router />
          </>
        )}
      </TooltipProvider>
    </div>
  );
}

export default App;
