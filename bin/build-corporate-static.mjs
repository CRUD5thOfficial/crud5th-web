import { copyFileSync, cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(projectRoot, "corporate-site");
const publish = path.join(projectRoot, "dist/public");
const measurementId = process.env.GA4_MEASUREMENT_ID || "";
if (measurementId && !/^G-[A-Z0-9]+$/.test(measurementId)) {
  throw new Error("GA4_MEASUREMENT_ID must be a GA4 measurement ID or unset to disable analytics.");
}

const appPagePaths = ["/contact", "/privacy-policy", "/information-security", "/services/kotoport"];
const pagePaths = [...appPagePaths];
function collectPagePaths(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "assets") collectPagePaths(filename);
    else if (entry.name === "index.html") {
      pagePaths.push(`/${path.relative(source, directory).split(path.sep).filter(Boolean).join("/")}`);
    }
  }
}
collectPagePaths(source);
const pagePathsAttribute = JSON.stringify(pagePaths).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const analyticsTag = `<script src="/site-analytics.js" data-swup-ignore-script data-measurement-id="${measurementId}" data-page-paths="${pagePathsAttribute}" defer></script>`;
function addAnalytics(html) {
  return html.replace("</head>", `${analyticsTag}</head>`);
}

// Keep the existing app and its Netlify Forms declaration at the legacy entry.
copyFileSync(path.join(publish, "index.html"), path.join(publish, "legacy-app.html"));
cpSync(source, publish, { recursive: true });

let memberLinks = 0;
function addMemberLinks(html) {
  for (const [itemClass, linkClass] of [['nav_item', 'nav_item_link'], ['footer_menu_item', 'footer_menu_link']]) {
    const marker = `<li class="${itemClass}" data-menu="recruit">`;
    const memberMarker = `<li class="${itemClass}" data-menu="member">`;
    if (html.includes(marker) && !html.includes(memberMarker)) {
      html = html.replace(marker, `${memberMarker}<a href="/#member" class="${linkClass}" data-no-swup>MEMBER</a></li>${marker}`);
      memberLinks += 1;
    }
  }
  return html;
}

let contactLinks = 0;
function activateContactLinks(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      activateContactLinks(filename);
    } else if (entry.name.endsWith(".html")) {
      const relative = path.relative(source, filename);
      const html = addMemberLinks(readFileSync(filename, "utf8")).replace(
        /<div class="(nav_item_link|footer_menu_link)">CONTACT<\/div>/g,
        (_, className) => {
          contactLinks += 1;
          return `<a class="${className}" href="/contact" data-no-swup>CONTACT</a>`;
        },
      );
      writeFileSync(path.join(publish, relative), relative.startsWith(`assets${path.sep}`) ? html : addAnalytics(html));
    }
  }
}
activateContactLinks(source);
const legacyEntry = path.join(publish, "legacy-app.html");
writeFileSync(legacyEntry, addAnalytics(readFileSync(legacyEntry, "utf8")));

// Static preview servers can resolve the app routes without Netlify rewrites.
for (const route of appPagePaths) {
  const directory = path.join(publish, route.slice(1));
  mkdirSync(directory, { recursive: true });
  copyFileSync(legacyEntry, path.join(directory, "index.html"));
  copyFileSync(legacyEntry, `${directory}.html`);
}

// Local research blocks submission; production uses the unchanged existing form.
copyFileSync(
  path.join(projectRoot, "bin/corporate-production-navigation.js"),
  path.join(publish, "assets/local/local-research-guard.js"),
);
console.log(`Published corporate site with ${contactLinks} active contact links, ${memberLinks} member links, and the existing app.`);
