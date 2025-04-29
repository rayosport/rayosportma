import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useLanguage } from "./hooks/use-language";
import Loader from "./components/ui/Loader";
import Header from "./components/layout/Header";
import { useEffect, useState } from "react";

// Base path for GitHub Pages
const BASE_PATH = '/rayosportma';

function Router() {
  return (
    <Switch>
      <Route path={`${BASE_PATH}/`} component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { direction } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

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
