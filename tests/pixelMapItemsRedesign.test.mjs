import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mainSource = readFileSync(
  resolve(process.cwd(), "phaser-rpg/src/scenes/Main.tsx"),
  "utf8"
);
const hostSource = readFileSync(
  resolve(process.cwd(), "src/minigame/HostView.jsx"),
  "utf8"
);
const pixelCss = readFileSync(
  resolve(process.cwd(), "src/minigame/pixel-ui.css"),
  "utf8"
);

assert.match(mainSource, /private drawOpportunityPixelArt\(/);
assert.match(mainSource, /private drawPortalPixelArt\(/);
assert.doesNotMatch(mainSource, /const bookLabel = this\.add\.text/);
assert.doesNotMatch(mainSource, /const gateLabel = this\.add\.text/);
assert.doesNotMatch(mainSource, /gateLabel/);
assert.doesNotMatch(mainSource, /container\.add\(\[glow,\s*icon,\s*bookLabel\]\)/);
assert.doesNotMatch(mainSource, /container\.add\(\[outerGlow,\s*portal,\s*gateLabel\]\)/);
assert.match(mainSource, /window\.parent\.postMessage\(\s*\{\s*type: 'NHAT_SACH'/s);
assert.match(mainSource, /window\.parent\.postMessage\(\s*\{\s*type: 'ESCAPED_GATE'/s);

assert.match(hostSource, /className="btn-market-flat pixel-event-button"/);
assert.match(hostSource, /className="pixel-event-title"/);
assert.match(hostSource, /className="pixel-event-hint"/);
assert.match(pixelCss, /\.pixel-event-button/);
assert.match(pixelCss, /\.pixel-event-hint/);
