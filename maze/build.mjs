import { readFileSync, writeFileSync } from "node:fs";
const base = new URL(".", import.meta.url);
const data = JSON.parse(readFileSync(new URL("./roadmaps.json", base), "utf8"));
const template = readFileSync(new URL("./worker.template.js", base), "utf8");
const marker = "const DATA = __MAZE_DATA__;";
if (!template.includes(marker)) throw new Error("Missing Worker data placeholder");
writeFileSync(new URL("./worker.js", base), template.replace(marker, "const DATA = " + JSON.stringify(data) + ";"));
console.log("Built Maze: " + data.stats.institutionCount + " institutions, " + data.stats.rungCount + " steps, " + data.stats.indexedEmails + " mail records.");
