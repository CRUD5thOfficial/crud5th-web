(() => {
  if (location.pathname === "/" && location.hash === "#contact") {
    location.replace("/contact#contact");
    return;
  }

  // Routes without Swup containers need a full document navigation.
  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const anchor = target?.closest("a[href]");
    if (!anchor) return;
    const destination = new URL(anchor.href, location.href);
    const fullNavigationRoute = ["/contact", "/privacy-policy", "/information-security"].includes(destination.pathname)
      || destination.pathname.startsWith("/services/")
      || ["/products/miakashi", "/products/miakashi/"].includes(destination.pathname);
    if (destination.origin !== location.origin || !fullNavigationRoute) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign(destination.href);
  }, true);
})();
