/**
 * Screenshots do site Condor usando o Chrome instalado, headless.
 *  - full-page desktop/mobile com ?motion=0 (reveals desativados)
 *  - hero e seções COM motion
 * Uso: node scripts/shoot.mjs [urlBase]
 * Obs.: usa o puppeteer-core instalado no projeto irmão "Grupo Alvo".
 */
import { createRequire } from "module";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(
  "C:/Users/Vini_/OneDrive - Instituto Presbiteriano Mackenzie/Área de Trabalho/Vesta/Projeto/Grupo Alvo/package.json"
);
const puppeteer = require("puppeteer-core");

const base = process.argv[2] || "https://viniciusextremxd.github.io/condor-extintores";
const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "shots");
mkdirSync(outDir, { recursive: true });

const VIEWS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "tablet", width: 820, height: 1180 },
  { tag: "mobile", width: 390, height: 844 },
];

const executablePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await puppeteer.launch({ executablePath, headless: "new" });

async function settleImages(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = "eager"));
    await Promise.all(
      [...document.images].map((i) =>
        i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })
      )
    );
  });
}

// ---- full-page estático (motion=0) ----
for (const view of VIEWS) {
  const page = await browser.newPage();
  await page.setViewport({ width: view.width, height: view.height, deviceScaleFactor: 1 });
  await page.goto(`${base}/?motion=0`, { waitUntil: "networkidle0", timeout: 45000 });
  await settleImages(page);
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: join(outDir, `full-${view.tag}.png`), fullPage: true });
  console.log("ok full", view.tag);
  await page.close();
}

// ---- COM motion ----
const live = await browser.newPage();
live.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
await live.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await live.goto(base, { waitUntil: "networkidle0", timeout: 45000 });
await new Promise((r) => setTimeout(r, 2200)); // intro do hero
await live.screenshot({ path: join(outDir, "live-hero-1.png") });
console.log("ok live-hero-1");

// slide 2 (claro)
await live.click(".hero-dot:nth-child(2)");
await new Promise((r) => setTimeout(r, 1800));
await live.screenshot({ path: join(outDir, "live-hero-2.png") });
console.log("ok live-hero-2");

// serviços / avcb
await live.evaluate(() => document.querySelector("#licenciamento").scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 1500));
await live.screenshot({ path: join(outDir, "live-avcb.png") });
console.log("ok live-avcb");

// faq aberto
await live.evaluate(() => document.querySelector("#dicas").scrollIntoView());
await new Promise((r) => setTimeout(r, 1200));
await live.click(".faq-item:nth-child(2) summary");
await new Promise((r) => setTimeout(r, 900));
await live.screenshot({ path: join(outDir, "live-faq.png") });
console.log("ok live-faq");

// mobile hero com motion
const mob = await browser.newPage();
await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await mob.goto(base, { waitUntil: "networkidle0", timeout: 45000 });
await new Promise((r) => setTimeout(r, 2200));
await mob.screenshot({ path: join(outDir, "live-hero-mobile.png") });
console.log("ok live-hero-mobile");

await browser.close();
console.log("done");
