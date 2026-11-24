import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = path.join(root, 'lighthouse', 'reports');
const baseUrl = process.env.LIGHTHOUSE_BASE_URL ?? 'http://127.0.0.1:4173';
const pages = [{ name: 'home', path: '/' }];
const presets = ['desktop', 'mobile'];
const runs = 3;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

async function waitForServer(url, timeoutMs = 60_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Servidor não respondeu em ${url}.`);
}

async function ensureServer() {
  try {
    await fetch(baseUrl);
    return null;
  } catch {
    const child = spawn('pnpm', ['preview'], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    await waitForServer(baseUrl);
    return child;
  }
}

await mkdir(reportsDir, { recursive: true });

const server = await ensureServer();
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH ?? chromium.executablePath(),
  chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
});

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  runsPerProfile: runs,
  lighthouseVersion: (await import('lighthouse/package.json', { with: { type: 'json' } })).default
    .version,
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  },
  measurements: [],
};

try {
  for (const preset of presets) {
    for (const { name: pageName, path: page } of pages) {
      const scores = { performance: [], accessibility: [], 'best-practices': [], seo: [] };
      const metrics = { lcp: [], cls: [], tbt: [] };

      for (let run = 1; run <= runs; run += 1) {
        const outputPath = path.join(reportsDir, `${pageName}-${preset}-run-${run}.report`);
        const result = await lighthouse(`${baseUrl}${page}`, {
          port: chrome.port,
          output: ['html', 'json'],
          logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          settings: { preset },
        });

        await writeFile(`${outputPath}.json`, JSON.stringify(result.lhr, null, 2));
        await writeFile(`${outputPath}.html`, result.report[0]);

        const categories = result.lhr.categories;
        scores.performance.push(categories.performance.score * 100);
        scores.accessibility.push(categories.accessibility.score * 100);
        scores['best-practices'].push(categories['best-practices'].score * 100);
        scores.seo.push(categories.seo.score * 100);

        metrics.lcp.push(result.lhr.audits['largest-contentful-paint'].numericValue);
        metrics.cls.push(result.lhr.audits['cumulative-layout-shift'].numericValue);
        metrics.tbt.push(result.lhr.audits['total-blocking-time'].numericValue);
      }

      summary.measurements.push({
        page: page || '/',
        pageName,
        preset,
        median: {
          performance: median(scores.performance),
          accessibility: median(scores.accessibility),
          bestPractices: median(scores['best-practices']),
          seo: median(scores.seo),
        },
        metrics: {
          lcpMs: median(metrics.lcp),
          cls: median(metrics.cls),
          tbtMs: median(metrics.tbt),
        },
        rawScores: scores,
        rawMetrics: metrics,
      });
    }
  }

  await writeFile(path.join(reportsDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.table(
    summary.measurements.map((item) => ({
      page: item.pageName,
      profile: item.preset,
      performance: item.median.performance.toFixed(1),
      accessibility: item.median.accessibility.toFixed(1),
      bestPractices: item.median.bestPractices.toFixed(1),
      seo: item.median.seo.toFixed(1),
      LCP: `${item.metrics.lcpMs.toFixed(0)} ms`,
      CLS: item.metrics.cls.toFixed(3),
      TBT: `${item.metrics.tbtMs.toFixed(0)} ms`,
    })),
  );
} finally {
  await chrome.kill();
  server?.kill('SIGTERM');
}
