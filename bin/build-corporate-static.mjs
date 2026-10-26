import { copyFileSync, cpSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(projectRoot, "corporate-site");
const publish = path.join(projectRoot, "dist/public");
const measurementId = process.env.GA4_MEASUREMENT_ID || "";
if (measurementId && !/^G-[A-Z0-9]+$/.test(measurementId)) {
  throw new Error("GA4_MEASUREMENT_ID must be a GA4 measurement ID or unset to disable analytics.");
}

const pagePaths = ["/contact", "/privacy-policy", "/information-security", "/services/kotoport"];
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

let contactLinks = 0;
function activateContactLinks(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      activateContactLinks(filename);
    } else if (entry.name.endsWith(".html")) {
      const relative = path.relative(source, filename);
      const html = readFileSync(filename, "utf8").replace(
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

// Local research blocks submission; production uses the unchanged existing form.
copyFileSync(
  path.join(projectRoot, "bin/corporate-production-navigation.js"),
  path.join(publish, "assets/local/local-research-guard.js"),
);
console.log(`Published corporate site with ${contactLinks} active contact links and the existing app.`);
