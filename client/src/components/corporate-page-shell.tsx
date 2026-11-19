import { useEffect, useRef, type ReactNode } from "react";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/sections/footer";
import "@/pages/contact-theme.css";

export default function CorporatePageShell({ children, page }: { children: ReactNode; page: "contact" | "legal" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const menu = container?.querySelector<HTMLElement>(".corporate-menu");
    const footer = container?.querySelector<HTMLElement>(".corporate-footer");
    if (!container || !menu || !footer) return;

    const updateFooterVisibility = () => {
      const menuRect = menu.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      container.dataset.footerActive = String(footerRect.top <= menuRect.bottom && footerRect.bottom > menuRect.top);
      if (footerRect.top < window.innerHeight && footerRect.bottom > 0) {
        container.dataset.footerEntered = "true";
      }
    };
    updateFooterVisibility();
    window.addEventListener("scroll", updateFooterVisibility, { passive: true });
    window.addEventListener("resize", updateFooterVisibility);
    return () => {
      window.removeEventListener("scroll", updateFooterVisibility);
      window.removeEventListener("resize", updateFooterVisibility);
    };
  }, []);

  return (
    <div ref={containerRef} className={`corporate-page corporate-page--${page}${page === "contact" ? " gen-contact-page" : ""}`}>
      <link rel="stylesheet" href="/assets/local/crud5th-gen-fonts.css" />
      <Navigation corporate />
      <main>{children}</main>
      <Footer corporate />
    </div>
  );
}
