import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import UniversitiesHubPage from "@/pages/universite/index";
import UM6SSPage from "@/pages/universite/um6ss";
import CompaniesHubPage from "@/pages/entreprise/index";
import DemoEntreprisePage from "@/pages/entreprise/demo-entreprise";
import NemoPage from "@/pages/entreprise/nemo";
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
      <Route path="/universite" component={UniversitiesHubPage} />
      <Route path="/universite/um6ss" component={UM6SSPage} />
      <Route path="/entreprise" component={CompaniesHubPage} />
      <Route path="/entreprise/demo-entreprise" component={DemoEntreprisePage} />
      <Route path="/entreprise/nemo" component={NemoPage} />
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
