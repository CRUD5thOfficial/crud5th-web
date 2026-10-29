import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/ui/navigation";
import Contact from "@/components/sections/contact";
import Footer from "@/components/sections/footer";
import Kotoport from "@/pages/kotoport";
import { kotoportContent } from "@/pages/kotoport-content";
import InformationSecurity from "@/pages/information-security";
import PrivacyPolicy from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";
import Preloader from "@/components/preloader";
import "@/pages/contact-theme.css";

function CorporateHome() {
  useEffect(() => {
    window.location.replace(`/${window.location.search}${window.location.hash}`);
  }, []);
  return null;
}

function ContactPage() {
  return (
    <div className="gen-contact-page min-h-screen bg-background text-foreground overflow-x-hidden">
      <link rel="stylesheet" href="/assets/local/crud5th-gen-fonts.css" />
      <Navigation corporate />
      <main className="pt-16">
        <Contact />
      </main>
      <Footer corporate />
    </div>
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
      <Route path="/information-security" component={InformationSecurity} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(
    () => window.location.pathname !== kotoportContent.route && window.location.pathname !== "/contact",
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
