#!/usr/bin/env node
// Builds the SVG assets README.md uses: the banner, chips, link buttons and line icons.
//
//   npm install && npm run build
//
// The banner, chips and buttons come out as light/dark pairs. README.md picks one with
// <picture><source media="(prefers-color-scheme: dark)">, which GitHub maps to the
// reader's GitHub theme. Text is converted to outlines (Inter), so the images look
// the same whatever fonts the reader has installed.
//
// To add a technology: add a line to BRAND (if it has a logo in Simple Icons) and to CHIPS,
// run the build, and reference assets/chips/<name>-light.svg and -dark.svg from README.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import * as simpleIcons from 'simple-icons';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets');
const MODULES = path.join(ROOT, 'node_modules');

// ---------------------------------------------------------------- themes

// Colours follow GitHub's light and dark default themes.
const THEMES = {
  light: {
    fg: '#1f2328',
    muted: '#59636e',
    chipFill: '#818b98', chipFillOpacity: 0.1,
    chipStroke: '#1f2328', chipStrokeOpacity: 0.14,
    panel: '#f6f8fa', panelStroke: '#d1d9e0',
    glowA: '#54aeff', glowAOpacity: 0.3,
    glowB: '#c297ff', glowBOpacity: 0.26,
    grid: '#1f2328', gridOpacity: 0.16,
    tile: '#ffffff', tileStroke: '#1f2328', tileStrokeOpacity: 0.1, tileShadowOpacity: 0.1,
  },
  dark: {
    fg: '#f0f6fc',
    muted: '#9198a1',
    chipFill: '#9198a1', chipFillOpacity: 0.12,
    chipStroke: '#f0f6fc', chipStrokeOpacity: 0.16,
    panel: '#151b23', panelStroke: '#3d444d',
    glowA: '#1f6feb', glowAOpacity: 0.34,
    glowB: '#8957e5', glowBOpacity: 0.3,
    grid: '#f0f6fc', gridOpacity: 0.14,
    tile: '#262c36', tileStroke: '#f0f6fc', tileStrokeOpacity: 0.12, tileShadowOpacity: 0.35,
  },
};

// One accent gradient, readable on both themes, used by the line icons and the banner.
const ACCENT = ['#2f81f7', '#a371f7'];
const GOLD = ['#e3b341', '#bf8700'];

// ---------------------------------------------------------------- fonts

function loadFont(file) {
  const buf = fs.readFileSync(path.join(MODULES, file));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

const FONTS = {
  500: loadFont('@fontsource/inter/files/inter-latin-500-normal.woff'),
  600: loadFont('@fontsource/inter/files/inter-latin-600-normal.woff'),
  800: loadFont('@fontsource/inter/files/inter-latin-800-normal.woff'),
};

const r2 = (n) => Math.round(n * 100) / 100;

// Lays text out glyph by glyph and returns its outline. (opentype.js' own layout
// stops on a GSUB lookup in Inter that it does not support.)
function outline(text, { font, size, x = 0, y = 0, tracking = 0 }) {
  const f = FONTS[font];
  const scale = size / f.unitsPerEm;
  let pen = x;
  let d = '';
  for (const ch of text) {
    const g = f.charToGlyph(ch);
    if (g.index === 0 && ch !== ' ') throw new Error(`No glyph for ${JSON.stringify(ch)} in Inter ${font}`);
    d += g.getPath(pen, y, size).toPathData(2);
    pen += g.advanceWidth * scale + tracking;
  }
  return { d, width: pen - tracking - x };
}

const capHeight = (font, size) => (FONTS[font].tables.os2.sCapHeight / FONTS[font].unitsPerEm) * size;

// ---------------------------------------------------------------- icons

// Brand marks come from Simple Icons (24 x 24, filled): [export name, colour on light, colour on dark].
// The second colour is there because some brand colours are too faint on one of the backgrounds.
const BRAND = {
  python: ['siPython', '#3776ab', '#6aa9dd'],
  javascript: ['siJavascript', '#d9b800', '#f7df1e'],
  swift: ['siSwift', '#f05138', '#f05138'],
  pytorch: ['siPytorch', '#ee4c2c', '#ee4c2c'],
  scikitlearn: ['siScikitlearn', '#f7931e', '#f7931e'],
  fastapi: ['siFastapi', '#009688', '#12b5a6'],
  streamlit: ['siStreamlit', '#ff4b4b', '#ff4b4b'],
  react: ['siReact', '#087ea4', '#58c4dc'],
  nextjs: ['siNextdotjs', '#000000', '#ffffff'],
  git: ['siGit', '#f03c2e', '#f03c2e'],
  langgraph: ['siLanggraph', '#1c7ed6', '#7fc8ff'],
  meta: ['siMeta', '#0467df', '#4a97f7'],
};

// Simple Icons has no LinkedIn mark, so this one is drawn here: a rounded square with "in" cut out.
const LINKEDIN =
  'M4.2 2h15.6A2.2 2.2 0 0 1 22 4.2v15.6a2.2 2.2 0 0 1-2.2 2.2H4.2A2.2 2.2 0 0 1 2 19.8V4.2A2.2 2.2 0 0 1 4.2 2z' +
  'M5.55 9.6h2.9v8.9h-2.9zM7 5.3a1.7 1.7 0 1 1 0 3.4a1.7 1.7 0 0 1 0-3.4z' +
  'M10.2 9.6h2.78v1.22h.04c.39-.73 1.33-1.5 2.74-1.5c2.93 0 3.47 1.93 3.47 4.44v4.74h-2.9v-4.2c0-1 0-2.29-1.4-2.29s-1.61 1.09-1.61 2.22v4.27h-2.9z';

// The inside of a Lucide icon (24 x 24, stroked).
function lucide(name) {
  const svg = fs.readFileSync(path.join(MODULES, 'lucide-static/icons', `${name}.svg`), 'utf8');
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[\s\S]*?>/, '')
    .replace('</svg>', '')
    .replace(/\s*\n\s*/g, '')
    .trim();
}

// Draws an icon into a size x size box at (x, y).
// `icon` is a key of BRAND, 'linkedin', or 'lucide:<name>' (drawn in `stroke`).
function drawIcon(icon, { x, y, size, theme, stroke, strokeWidth = 2 }) {
  const t = `translate(${r2(x)} ${r2(y)}) scale(${r2(size / 24)})`;
  if (icon.startsWith('lucide:')) {
    return `<g transform="${t}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${lucide(icon.slice(7))}</g>`;
  }
  if (icon === 'linkedin') {
    return `<path transform="${t}" fill="${theme === 'light' ? '#0a66c2' : '#4a9df0'}" fill-rule="evenodd" d="${LINKEDIN}"/>`;
  }
  const [key, light, dark] = BRAND[icon];
  return `<path transform="${t}" fill="${theme === 'light' ? light : dark}" d="${simpleIcons[key].path}"/>`;
}

// ---------------------------------------------------------------- chips and buttons

// A chip is an icon and a label in a rounded box: 'tag' for technologies, 'button' for links.
const KINDS = {
  tag: { h: 26, padL: 9, padR: 10, icon: 14, gap: 6, font: 500, size: 12, radius: 6, strokeWidth: 2.1 },
  button: { h: 34, padL: 12, padR: 14, icon: 16, gap: 8, font: 600, size: 13.5, radius: 8, strokeWidth: 2 },
};

function chip({ label, icon, kind, theme }) {
  const k = KINDS[kind];
  const c = THEMES[theme];
  const textX = k.padL + k.icon + k.gap;
  const baseline = (k.h + capHeight(k.font, k.size)) / 2;
  const text = outline(label, { font: k.font, size: k.size, x: textX, y: baseline });
  const w = Math.ceil(textX + text.width + k.padR);
  const mark = drawIcon(icon, {
    x: k.padL, y: (k.h - k.icon) / 2, size: k.icon, theme, stroke: c.muted, strokeWidth: k.strokeWidth,
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${k.h}" viewBox="0 0 ${w} ${k.h}" role="img" aria-label="${label}">
<title>${label}</title>
<rect x="0.5" y="0.5" width="${w - 1}" height="${k.h - 1}" rx="${k.radius}" fill="${c.chipFill}" fill-opacity="${c.chipFillOpacity}" stroke="${c.chipStroke}" stroke-opacity="${c.chipStrokeOpacity}"/>
${mark}
<path fill="${c.fg}" d="${text.d}"/>
</svg>
`;
}

// file name: [label, icon]
const CHIPS = {
  python: ['Python', 'python'],
  javascript: ['JavaScript', 'javascript'],
  swift: ['Swift', 'swift'],
  sql: ['SQL', 'lucide:database'],
  pytorch: ['PyTorch', 'pytorch'],
  'scikit-learn': ['scikit-learn', 'scikitlearn'],
  mujoco: ['MuJoCo', 'lucide:box'],
  langgraph: ['LangGraph', 'langgraph'],
  fastapi: ['FastAPI', 'fastapi'],
  streamlit: ['Streamlit', 'streamlit'],
  react: ['React', 'react'],
  nextjs: ['Next.js', 'nextjs'],
  git: ['Git', 'git'],
  'sam-3-1': ['SAM 3.1', 'meta'],
  'muse-spark': ['Muse Spark', 'meta'],
  hdf5: ['HDF5', 'lucide:layers'],
};

const BUTTONS = {
  linkedin: ['LinkedIn', 'linkedin'],
  email: ['Email', 'lucide:mail'],
};

// ---------------------------------------------------------------- line icons

// Lucide icons in a gradient that reads on both themes, so one file serves both.
// file name: [Lucide icon, gradient]
const LINE_ICONS = {
  education: ['graduation-cap', ACCENT],
  graduating: ['calendar-check', ACCENT],
  role: ['briefcase', ACCENT],
  citizenship: ['badge-check', ACCENT],
  awards: ['award', ACCENT],
  projects: ['rocket', ACCENT],
  team: ['users-round', ACCENT],
  tools: ['wrench', ACCENT],
  trophy: ['trophy', GOLD],
  medal: ['medal', GOLD],
};

function lineIcon(name, colors) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true">
<defs><linearGradient id="g" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs>
<g fill="none" stroke="url(#g)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${lucide(name)}</g>
</svg>
`;
}

// ---------------------------------------------------------------- banner

const BANNER = {
  name: 'Joshua Kim',
  role: 'Software Engineer · New Grad, Feb 2027',
  focus: 'Reinforcement learning, simulation & applied AI',
  // Rows of logo tiles on the right, in the order they are drawn.
  tiles: [
    ['python', 'pytorch', 'react', 'swift'],
    ['fastapi', 'langgraph', 'scikitlearn'],
    ['git', 'javascript', 'streamlit', 'nextjs'],
  ],
};

function banner(theme) {
  const c = THEMES[theme];
  const W = 1280;
  const H = 340;

  const name = outline(BANNER.name, { font: 800, size: 92, x: 62, y: 160, tracking: -2.6 });
  const role = outline(BANNER.role, { font: 600, size: 27, x: 66, y: 212 });
  const focus = outline(BANNER.focus, { font: 500, size: 22, x: 66, y: 250 });

  // Logo tiles: rows centred on one vertical line, so the short row sits between the long ones.
  const TILE = 72;
  const GAP = 14;
  const centreX = 1052;
  const top = (H - (BANNER.tiles.length * TILE + (BANNER.tiles.length - 1) * GAP)) / 2;
  const tiles = BANNER.tiles
    .map((row, r) => {
      const rowWidth = row.length * TILE + (row.length - 1) * GAP;
      return row
        .map((icon, i) => {
          const x = centreX - rowWidth / 2 + i * (TILE + GAP);
          const y = top + r * (TILE + GAP);
          const logo = drawIcon(icon, { x: x + (TILE - 34) / 2, y: y + (TILE - 34) / 2, size: 34, theme });
          return `<rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="18" fill="${c.tile}" stroke="${c.tileStroke}" stroke-opacity="${c.tileStrokeOpacity}" filter="url(#lift)"/>${logo}`;
        })
        .join('\n');
    })
    .join('\n');

  const label = `${BANNER.name}. ${BANNER.role}. ${BANNER.focus.replace('&', 'and')}.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
<title>${label}</title>
<defs>
<clipPath id="panel"><rect width="${W}" height="${H}" rx="22"/></clipPath>
<radialGradient id="glowA" cx="1010" cy="40" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.glowA}" stop-opacity="${c.glowAOpacity}"/><stop offset="1" stop-color="${c.glowA}" stop-opacity="0"/></radialGradient>
<radialGradient id="glowB" cx="1230" cy="330" r="460" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.glowB}" stop-opacity="${c.glowBOpacity}"/><stop offset="1" stop-color="${c.glowB}" stop-opacity="0"/></radialGradient>
<linearGradient id="fade" x1="600" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
<mask id="right" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
<pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="13" cy="13" r="1.3" fill="${c.grid}" fill-opacity="${c.gridOpacity}"/></pattern>
<linearGradient id="accent" x1="66" y1="0" x2="138" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${ACCENT[0]}"/><stop offset="1" stop-color="${ACCENT[1]}"/></linearGradient>
<filter id="lift" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#010409" flood-opacity="${c.tileShadowOpacity}"/></filter>
</defs>
<g clip-path="url(#panel)">
<rect width="${W}" height="${H}" fill="${c.panel}"/>
<rect width="${W}" height="${H}" fill="url(#glowA)"/>
<rect width="${W}" height="${H}" fill="url(#glowB)"/>
<rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#right)"/>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="21.5" fill="none" stroke="${c.panelStroke}"/>
<path fill="${c.fg}" d="${name.d}"/>
<path fill="${c.fg}" d="${role.d}"/>
<path fill="${c.muted}" d="${focus.d}"/>
<rect x="66" y="274" width="72" height="5" rx="2.5" fill="url(#accent)"/>
${tiles}
</svg>
`;
}

// ---------------------------------------------------------------- write

function write(file, content) {
  const target = path.join(OUT, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

// Start from empty folders so a renamed or removed entry leaves no stale file behind.
for (const dir of ['chips', 'buttons', 'icons']) fs.rmSync(path.join(OUT, dir), { recursive: true, force: true });

let count = 0;
for (const theme of ['light', 'dark']) {
  write(`banner-${theme}.svg`, banner(theme));
  count += 1;
  for (const [name, [label, icon]] of Object.entries(CHIPS)) {
    write(`chips/${name}-${theme}.svg`, chip({ label, icon, kind: 'tag', theme }));
    count += 1;
  }
  for (const [name, [label, icon]] of Object.entries(BUTTONS)) {
    write(`buttons/${name}-${theme}.svg`, chip({ label, icon, kind: 'button', theme }));
    count += 1;
  }
}
for (const [name, [icon, colors]] of Object.entries(LINE_ICONS)) {
  write(`icons/${name}.svg`, lineIcon(icon, colors));
  count += 1;
}
console.log(`Wrote ${count} files to ${path.relative(process.cwd(), OUT) || '.'}`);
