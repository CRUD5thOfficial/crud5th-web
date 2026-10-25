import { copyFileSync, cpSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(projectRoot, "corporate-site");
const publish = path.join(projectRoot, "dist/public");

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
      writeFileSync(path.join(publish, relative), html);
    }
  }
}
activateContactLinks(source);

// Local research blocks submission; production uses the unchanged existing form.
copyFileSync(
  path.join(projectRoot, "bin/corporate-production-navigation.js"),
  path.join(publish, "assets/local/local-research-guard.js"),
);
console.log(`Published corporate site with ${contactLinks} active contact links and the existing app.`);
