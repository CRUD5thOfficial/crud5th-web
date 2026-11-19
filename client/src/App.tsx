import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Contact from "@/components/sections/contact";
import CorporatePageShell from "@/components/corporate-page-shell";
import Kotoport from "@/pages/kotoport";
import { kotoportContent } from "@/pages/kotoport-content";
import InformationSecurity from "@/pages/information-security";
import PrivacyPolicy from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";
import Preloader from "@/components/preloader";

function CorporateHome() {
  useEffect(() => {
    window.location.replace(`/${window.location.search}${window.location.hash}`);
  }, []);
  return null;
}

function ContactPage() {
  return (
    <CorporatePageShell page="contact">
      <Contact />
    </CorporatePageShell>
  );
}

function Router() {
  const [location] = useLocation();
  useEffect(() => {
    document.dispatchEvent(new Event("site-analytics:page-view"));
  }, [location]);
  return (
    <Switch>
      <Route path="/" component={CorporateHome} />
      <Route path="/contact" component={ContactPage} />
      <Route path={kotoportContent.route} component={Kotoport} />
      <Route path="/information-security">
        <CorporatePageShell page="legal"><InformationSecurity /></CorporatePageShell>
      </Route>
      <Route path="/privacy-policy">
        <CorporatePageShell page="legal"><PrivacyPolicy /></CorporatePageShell>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(
    () => {
      const pathname = window.location.pathname.replace(/\/+$/, "");
      return ![kotoportContent.route, "/contact", "/information-security", "/privacy-policy"].includes(pathname);
    },
  );

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {isLoading ? (
          <Preloader onComplete={handleLoadingComplete} />
        ) : (
          <Router />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
