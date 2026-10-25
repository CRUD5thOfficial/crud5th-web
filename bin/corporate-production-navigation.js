(() => {
  if (location.pathname === "/" && location.hash === "#contact") {
    location.replace("/contact#contact");
    return;
  }

  // These routes belong to the existing React app, outside the static Swup site.
  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const anchor = target?.closest("a[href]");
    if (!anchor) return;
    const destination = new URL(anchor.href, location.href);
    const legacyRoute = ["/contact", "/privacy-policy", "/information-security"].includes(destination.pathname)
      || destination.pathname.startsWith("/services/");
    if (destination.origin !== location.origin || !legacyRoute) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign(destination.href);
  }, true);
})();
