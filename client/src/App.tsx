import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "./hooks/use-language";
import Loader from "./components/ui/Loader";
import Header from "./components/layout/Header";
import { useEffect, useState } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";

// Lazy load all pages for code splitting
const NotFound = lazy(() => import("@/pages/not-found"));
const Accueil = lazy(() => import("@/pages/Accueil"));
const Football = lazy(() => import("@/pages/Football"));
const Paddel = lazy(() => import("@/pages/Paddel"));
const Kids = lazy(() => import("@/pages/Kids"));
const Store = lazy(() => import("@/pages/Store"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const UniversitiesHubPage = lazy(() => import("@/pages/universite/index"));
const UM6SSPage = lazy(() => import("@/pages/universite/um6ss"));
const CompaniesHubPage = lazy(() => import("@/pages/entreprise/index"));
const DemoEntreprisePage = lazy(() => import("@/pages/entreprise/demo-entreprise"));
const NemoPage = lazy(() => import("@/pages/entreprise/nemo"));

// Route wrapper with Suspense for lazy loading
const RouteWithSuspense = ({ path, component: Component }: { path: string; component: React.LazyExoticComponent<React.ComponentType<any>> }) => {
  return (
    <Route path={path}>
      {(params) => (
        <Suspense fallback={<Loader />}>
          <Component {...params} />
        </Suspense>
      )}
    </Route>
  );
};

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
    <Suspense fallback={<Loader />}>
      <Switch>
        <Route path="/">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <Accueil {...params} />
            </Suspense>
          )}
        </Route>
        <Route path="/football">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <Football {...params} />
            </Suspense>
          )}
        </Route>
        <Route path="/padel">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <Paddel {...params} />
            </Suspense>
          )}
        </Route>
        <Route path="/kids">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <Kids {...params} />
            </Suspense>
          )}
        </Route>
        <Route path="/store">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <Store {...params} />
            </Suspense>
          )}
        </Route>
        <Route path="/faq">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <FAQ {...params} />
            </Suspense>
          )}
        </Route>
        <Route path="/universite">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <UniversitiesHubPage {...params} />
            </Suspense>
          )}
        </Route>
        <Route path="/universite/um6ss">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <UM6SSPage {...params} />
            </Suspense>
          )}
        </Route>
        <Route path="/entreprise">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <CompaniesHubPage {...params} />
            </Suspense>
          )}
        </Route>
        <Route path="/entreprise/demo-entreprise">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <DemoEntreprisePage {...params} />
            </Suspense>
          )}
        </Route>
        <Route path="/entreprise/nemo">
          {(params) => (
            <Suspense fallback={<Loader />}>
              <NemoPage {...params} />
            </Suspense>
          )}
        </Route>
        <Route>
          {(params) => (
            <Suspense fallback={<Loader />}>
              <NotFound {...params} />
            </Suspense>
          )}
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  const { direction } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Google Analytics when app loads (non-blocking)
    initGA();

    // Reduce initial loading time - only show loader if really needed
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);

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
