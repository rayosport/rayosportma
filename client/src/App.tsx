import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "./hooks/use-language";
import Loader from "./components/ui/Loader";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
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

// Tournoi pages
const TournoiIndex = lazy(() => import("@/pages/tournoi/index"));
const TournoiClassement = lazy(() => import("@/pages/tournoi/classement"));
const TournoiMatchs = lazy(() => import("@/pages/tournoi/matchs"));
const TournoiMatchDetail = lazy(() => import("@/pages/tournoi/match-detail"));
const TournoiStats = lazy(() => import("@/pages/tournoi/stats"));
const TournoiTeamDetail = lazy(() => import("@/pages/tournoi/team-detail"));
const TournoiAdminLogin = lazy(() => import("@/pages/tournoi/admin/login"));
const TournoiAdminDashboard = lazy(() => import("@/pages/tournoi/admin/index"));
const TournoiAdminLeague = lazy(() => import("@/pages/tournoi/admin/league"));
const TournoiAdminTeams = lazy(() => import("@/pages/tournoi/admin/teams"));
const TournoiAdminMatchs = lazy(() => import("@/pages/tournoi/admin/matchs"));
const TournoiAdminMatchEdit = lazy(() => import("@/pages/tournoi/admin/match-edit"));

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
        {/* Tournoi admin routes (specific before generic) */}
        <Route path="/tournoi/admin/login">
          {(params) => (<Suspense fallback={<Loader />}><TournoiAdminLogin {...params} /></Suspense>)}
        </Route>
        <Route path="/tournoi/admin/league">
          {(params) => (<Suspense fallback={<Loader />}><TournoiAdminLeague {...params} /></Suspense>)}
        </Route>
        <Route path="/tournoi/admin/teams">
          {(params) => (<Suspense fallback={<Loader />}><TournoiAdminTeams {...params} /></Suspense>)}
        </Route>
        <Route path="/tournoi/admin/matchs">
          {(params) => (<Suspense fallback={<Loader />}><TournoiAdminMatchs {...params} /></Suspense>)}
        </Route>
        <Route path="/tournoi/admin/match/:id">
          {() => (<Suspense fallback={<Loader />}><TournoiAdminMatchEdit /></Suspense>)}
        </Route>
        <Route path="/tournoi/admin">
          {(params) => (<Suspense fallback={<Loader />}><TournoiAdminDashboard {...params} /></Suspense>)}
        </Route>
        {/* Tournoi public routes */}
        <Route path="/tournoi/classement">
          {(params) => (<Suspense fallback={<Loader />}><TournoiClassement {...params} /></Suspense>)}
        </Route>
        <Route path="/tournoi/matchs">
          {(params) => (<Suspense fallback={<Loader />}><TournoiMatchs {...params} /></Suspense>)}
        </Route>
        <Route path="/tournoi/match/:id">
          {() => (<Suspense fallback={<Loader />}><TournoiMatchDetail /></Suspense>)}
        </Route>
        <Route path="/tournoi/stats">
          {(params) => (<Suspense fallback={<Loader />}><TournoiStats {...params} /></Suspense>)}
        </Route>
        <Route path="/tournoi/team/:id">
          {() => (<Suspense fallback={<Loader />}><TournoiTeamDetail /></Suspense>)}
        </Route>
        <Route path="/tournoi">
          {(params) => (<Suspense fallback={<Loader />}><TournoiIndex {...params} /></Suspense>)}
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
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = location.startsWith('/tournoi/admin');

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
    <div className={`${direction} min-h-screen flex flex-col`}>
      <TooltipProvider>
        <Toaster />
        {isLoading ? (
          <Loader />
        ) : (
          <>
            {!isAdmin && <Header />}
            <div className="flex-1">
              <Router />
            </div>
            {!isAdmin && <Footer />}
          </>
        )}
      </TooltipProvider>
    </div>
  );
}

export default App;
