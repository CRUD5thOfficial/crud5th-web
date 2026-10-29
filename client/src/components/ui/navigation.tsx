import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Navigation({ corporate = false }: { corporate?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (id === "home") {
      window.location.assign("/");
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsMobileMenuOpen(false);
    }
  };

  if (corporate) {
    const links = [
      { label: "HOME", href: "/" },
      { label: "ABOUT", href: "/about" },
      { label: "RESEARCH", href: "/works" },
      { label: "SERVICES", href: "/service" },
      { label: "MEMBER", href: "/#member" },
      { label: "PRODUCTS", href: "/recruit" },
      { label: "CONTACT", href: "/contact" },
    ];
    return (
      <motion.nav
        initial={reducedMotion ? false : { y: -90 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full z-50"
        data-testid="navigation"
        aria-label="グローバルナビゲーション"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <a href="/" className="gradient-text" data-testid="logo">CRUD5th</a>
            <div className="hidden lg:flex items-center gap-6">
              {links.map(link => <a key={link.href} href={link.href} aria-current={link.href === "/contact" ? "page" : undefined}>{link.label}</a>)}
            </div>
            <button
              type="button"
              className="lg:hidden p-2"
              aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="corporate-mobile-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          <div id="corporate-mobile-menu" hidden={!isMobileMenuOpen} className="lg:hidden py-5 space-y-4" data-testid="mobile-menu">
            {links.map(link => <a key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} aria-current={link.href === "/contact" ? "page" : undefined}>{link.label}</a>)}
          </div>
        </div>
      </motion.nav>
    );
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/90 backdrop-blur-lg border-b border-border" : "bg-transparent"
      }`}
      data-testid="navigation"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold gradient-text cursor-pointer"
            onClick={() => scrollToSection("home")}
            data-testid="logo"
          >
            CRUD5th
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {[
              { label: "ホーム", id: "home" },
              { label: "サービス", id: "services" },
              { label: "チーム", id: "team" },
              { label: "お問い合わせ", id: "contact" }
            ].map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => scrollToSection(item.id)}
                className="hover:text-primary transition-colors duration-200"
                data-testid={`nav-link-${item.id}`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary p-2"
              data-testid="mobile-menu-button"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isMobileMenuOpen ? 1 : 0,
            height: isMobileMenuOpen ? "auto" : 0
          }}
          className="md:hidden overflow-hidden"
          data-testid="mobile-menu"
        >
          <div className="py-4 space-y-2">
            {[
              { label: "ホーム", id: "home" },
              { label: "サービス", id: "services" },
              { label: "チーム", id: "team" },
              { label: "お問い合わせ", id: "contact" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left py-2 hover:text-primary transition-colors"
                data-testid={`mobile-nav-link-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}
