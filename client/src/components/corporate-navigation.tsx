import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export const corporateLinks = [
  { label: "HOME", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "RESEARCH", href: "/works" },
  { label: "SERVICES", href: "/service" },
  { label: "MEMBER", href: "/#member" },
  { label: "PRODUCTS", href: "/recruit" },
  { label: "CONTACT", href: "/contact" },
];

export default function CorporateNavigation() {
  const [location] = useLocation();
  const currentPath = location.replace(/\/+$/, "") || "/";
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    if (!isOpen) return;

    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="corporate-menu"
      data-open={isOpen}
      data-testid="navigation"
      onBlur={(event) => {
        // Safari does not focus a clicked button, so focus leaves to nothing before the toggle click.
        // Clicks outside are closed by the pointerdown listener; only close here when focus moves to another element.
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="corporate-menu-button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="corporate-site-menu"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="mobile-menu-button"
      >
        <span className="corporate-menu-label">MENU</span>
        <span className="corporate-menu-symbol" aria-hidden="true" />
      </button>
      <nav
        ref={panelRef}
        id="corporate-site-menu"
        className="corporate-menu-panel"
        aria-label="グローバルナビゲーション"
        hidden={!isOpen}
        data-testid="mobile-menu"
      >
        <div className="corporate-menu-board">
          <div className="corporate-menu-scroll">
            <a href="/" className="corporate-menu-brand" data-testid="logo">CRUD5th</a>
            <ul className="corporate-menu-links">
              {corporateLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={link.href === currentPath ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}
