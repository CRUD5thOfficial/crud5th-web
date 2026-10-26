(() => {
  const settings = document.currentScript?.dataset;
  const measurementId = settings?.measurementId || "";
  if (!/^G-[A-Z0-9]+$/.test(measurementId)
    || window.location.hostname !== "crud5th.com"
    || window.location.protocol !== "https:"
    || window.self !== window.top
    || navigator.doNotTrack === "1"
    || window[`ga-disable-${measurementId}`]) return;

  const pagePaths = new Set(JSON.parse(settings.pagePaths || "[]"));
  const oncePerPage = new Set();
  let lastPagePath = null;
  let previousLocation = "";
  let viewObserver;

  // Keep the imported corporate template's unrelated window.gtag hook inactive.
  window.dataLayer = window.dataLayer || [];
  function send() { window.dataLayer.push(arguments); }

  function safeReferrer() {
    if (previousLocation) return previousLocation;
    if (!document.referrer) return "";
    try {
      const referrer = new URL(document.referrer);
      if (!/^https?:$/.test(referrer.protocol)) return "";
      if (referrer.origin !== window.location.origin) return `${referrer.origin}/`;
      return `${referrer.origin}${pagePaths.has(referrer.pathname) ? referrer.pathname : "/404"}`;
    } catch { return ""; }
  }

  function pageFields() {
    const pathname = window.location.pathname.replace(/\/$/, "") || "/";
    const pagePath = pagePaths.has(pathname) ? pathname : "/404";
    return {
      page_path: pagePath,
      page_location: `${window.location.origin}${pagePath}`,
      page_referrer: safeReferrer(),
      page_title: pagePath === "/" ? "CRUD5th" : `CRUD5th ${pagePath}`,
    };
  }

  function trackEvent(name, parameters = {}) {
    send("event", name, { ...pageFields(), ...parameters });
  }

  function observePricing() {
    viewObserver?.disconnect();
    if (typeof IntersectionObserver === "undefined") return;
    viewObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.target.dataset.analyticsView !== "kotoport_pricing_view"
          || oncePerPage.has("kotoport_pricing_view")) continue;
        oncePerPage.add("kotoport_pricing_view");
        trackEvent("kotoport_pricing_view");
      }
    });
    document.querySelectorAll('[data-analytics-view="kotoport_pricing_view"]').forEach(element => viewObserver.observe(element));
  }

  function trackPageView() {
    const fields = pageFields();
    if (lastPagePath !== fields.page_path) {
      oncePerPage.clear();
      send("set", fields);
      send("event", "page_view", fields);
      lastPagePath = fields.page_path;
      previousLocation = fields.page_location;
    }
    // React can notify after the initial document event, when its sections exist.
    observePricing();
  }

  send("js", new Date());
  // Navigation updates must also reach automatic engagement, which inherits global page fields.
  send("set", pageFields());
  send("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement("script");
  script.async = true;
  script.setAttribute("data-swup-ignore-script", "");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  document.addEventListener("swup:page:view", trackPageView);
  document.addEventListener("site-analytics:page-view", trackPageView);
  document.addEventListener("site-analytics:contact-success", () => trackEvent("generate_lead"));
  document.addEventListener("click", event => {
    if (event.target instanceof Element && event.target.closest("[data-analytics-contact]")) {
      trackEvent("kotoport_contact_click");
    }
  });
  document.addEventListener("change", event => {
    const input = event.target;
    if (!(input instanceof Element) || !input.validity?.valid || !input.value?.trim()) return;
    const calculator = input.closest("[data-analytics-calculator]")?.dataset.analyticsCalculator;
    if (!["pricing", "economics"].includes(calculator) || oncePerPage.has(calculator)) return;
    oncePerPage.add(calculator);
    trackEvent("kotoport_calculator_use", { calculator });
  });
  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      lastPagePath = null;
      trackPageView();
    }
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", trackPageView);
  else trackPageView();
})();
