import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface RouteMetric {
  route: string;
  navStartToFirstUI: number;
  navStartToUsableUI: number;
  navStartToNetworkIdle: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  consoleErrors: string[];
  failedRequests: string[];
  hasFullReload: boolean;
  notes?: string;
}

interface AuditResults {
  auth: {
    loginPageLoadMs: number;
    invalidLoginHandled: boolean;
    validLoginMs: number;
    sessionPersists: boolean;
    logoutWorks: boolean;
  };
  routes: RouteMetric[];
  transitions: {
    flow: string;
    durationMs: number;
    status: 'PASS' | 'FAIL';
  }[];
  viewports: {
    viewport: string;
    width: number;
    height: number;
    passed: boolean;
    issues: string[];
  }[];
  consoleErrorsSummary: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
}

async function runAudit() {
  console.log('==================================================');
  console.log('STARTING ELEVATE CRM E2E REGRESSION & PERFORMANCE AUDIT');
  console.log('==================================================');

  const browser: Browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${page.url()}] ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(`[${page.url()}] ${msg.text()}`);
    }
  });

  page.on('requestfailed', (req) => {
    failedRequests.push(`[${page.url()}] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });

  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('/auth/login')) {
      failedRequests.push(`[${page.url()}] ${res.status()} ${res.url()}`);
    }
  });

  const results: AuditResults = {
    auth: {
      loginPageLoadMs: 0,
      invalidLoginHandled: false,
      validLoginMs: 0,
      sessionPersists: false,
      logoutWorks: false,
    },
    routes: [],
    transitions: [],
    viewports: [],
    consoleErrorsSummary: { critical: [], high: [], medium: [], low: [] },
  };

  // -------------------------------------------------------------
  // PHASE 3: AUTHENTICATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- PHASE 3: AUTHENTICATION AUDIT ---');
  const t0 = Date.now();
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  results.auth.loginPageLoadMs = Date.now() - t0;
  console.log(`Login page loaded in ${results.auth.loginPageLoadMs}ms`);

  // Test Invalid Credentials
  console.log('Testing invalid credentials...');
  await page.fill('input[type="email"], input[name="email"]', 'wrong@example.com');
  await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  const hasErrorMsg = await page.locator('text=Invalid email or password, text=invalid, text=failed, text=Invalid').count() > 0;
  results.auth.invalidLoginHandled = hasErrorMsg;
  console.log(`Invalid login handled correctly: ${hasErrorMsg}`);

  // Test Valid Credentials
  console.log('Testing valid admin credentials...');
  await page.fill('input[type="email"], input[name="email"]', 'admin@elevate.com');
  await page.fill('input[type="password"], input[name="password"]', 'Admin@123');
  const tLogin = Date.now();
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  results.auth.validLoginMs = Date.now() - tLogin;
  console.log(`Valid login succeeded in ${results.auth.validLoginMs}ms -> reached Dashboard`);

  // Test Session Persistence
  const cookies = await context.cookies();
  results.auth.sessionPersists = cookies.some((c) => c.name === 'token');
  console.log(`Session persisted in cookie: ${results.auth.sessionPersists}`);

  // -------------------------------------------------------------
  // PHASE 4, 5, 6: ROUTE INVENTORY & PERFORMANCE AUDIT
  // -------------------------------------------------------------
  console.log('\n--- PHASE 4, 5, 6: ROUTE INVENTORY & PERFORMANCE AUDIT ---');

  const routesToTest = [
    '/dashboard',
    '/enquiries',
    '/enquiries/job-orders/pending',
    '/enquiries/job-orders/completed',
    '/follow-ups',
    '/call-register',
    '/admissions',
    '/services',
    '/proposals',
    '/invoices',
    '/expenses',
    '/reports',
    '/reports/telecaller',
    '/reports/branch',
    '/reports/admission-payment',
    '/reports/expense',
    '/reports/invoice',
    '/reports/income',
    '/reports/pending-payment',
    '/admin/data-management',
    '/admin/users',
    '/profile',
  ];

  for (const route of routesToTest) {
    console.log(`Testing route: ${route}`);
    const localConsoleErrors: string[] = [];
    const localFailedReqs: string[] = [];

    const errListener = (msg: any) => {
      if (msg.type() === 'error') localConsoleErrors.push(msg.text());
    };
    page.on('console', errListener);

    const startTime = Date.now();
    let firstUITime = 0;
    let usableUITime = 0;
    let networkIdleTime = 0;

    try {
      // Navigate via in-app click if link exists, otherwise page.goto
      const sidebarLink = page.locator(`a[href="${route}"]`).first();
      const linkCount = await sidebarLink.count();

      let usedSPA = false;
      if (linkCount > 0 && route !== '/dashboard') {
        usedSPA = true;
        await sidebarLink.click();
      } else {
        await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded' });
      }

      firstUITime = Date.now() - startTime;

      // Wait for content (table, cards, headings, or empty state)
      await Promise.race([
        page.waitForSelector('table, [role="table"], .grid, [data-slot="card"], main', { state: 'visible', timeout: 8000 }),
        page.waitForTimeout(2000),
      ]);
      usableUITime = Date.now() - startTime;

      // Measure network idle
      try {
        await page.waitForLoadState('networkidle', { timeout: 3000 });
      } catch (e) {}
      networkIdleTime = Date.now() - startTime;

      let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
      if (usableUITime > 2500) status = 'WARN';
      if (localConsoleErrors.length > 0) {
        if (localConsoleErrors.some((e) => e.includes('Error') || e.includes('Exception'))) {
          status = 'WARN';
        }
      }

      results.routes.push({
        route,
        navStartToFirstUI: firstUITime,
        navStartToUsableUI: usableUITime,
        navStartToNetworkIdle: networkIdleTime,
        status,
        consoleErrors: [...localConsoleErrors],
        failedRequests: [...localFailedReqs],
        hasFullReload: !usedSPA && route !== '/dashboard',
      });

      console.log(`  -> First UI: ${firstUITime}ms | Usable UI: ${usableUITime}ms | Status: ${status}`);
    } catch (err: any) {
      console.error(`  -> Route failed: ${route} - ${err.message}`);
      results.routes.push({
        route,
        navStartToFirstUI: firstUITime || (Date.now() - startTime),
        navStartToUsableUI: usableUITime || (Date.now() - startTime),
        navStartToNetworkIdle: networkIdleTime || (Date.now() - startTime),
        status: 'FAIL',
        consoleErrors: [err.message, ...localConsoleErrors],
        failedRequests: [...localFailedReqs],
        hasFullReload: false,
        notes: err.message,
      });
    } finally {
      page.off('console', errListener);
    }
  }

  // -------------------------------------------------------------
  // PHASE 8: ROUTE TRANSITION FLOWS
  // -------------------------------------------------------------
  console.log('\n--- PHASE 8: ROUTE TRANSITION PERFORMANCE FLOWS ---');

  // Flow 1: Dashboard -> Enquiries -> Follow-up -> back to Enquiries
  try {
    const tFlow1Start = Date.now();
    await page.goto('http://localhost:3000/dashboard');
    await page.locator('a[href="/enquiries"]').first().click();
    await page.waitForSelector('main', { state: 'visible' });
    await page.locator('a[href="/follow-ups"]').first().click();
    await page.waitForSelector('main', { state: 'visible' });
    await page.locator('a[href="/enquiries"]').first().click();
    await page.waitForSelector('main', { state: 'visible' });
    const flow1Ms = Date.now() - tFlow1Start;
    results.transitions.push({
      flow: 'Dashboard -> Enquiries -> Follow-up -> Enquiries',
      durationMs: flow1Ms,
      status: 'PASS',
    });
    console.log(`Flow 1 completed in ${flow1Ms}ms`);
  } catch (e: any) {
    results.transitions.push({
      flow: 'Dashboard -> Enquiries -> Follow-up -> Enquiries',
      durationMs: 0,
      status: 'FAIL',
    });
  }

  // Flow 2: Enquiries -> Admissions -> Invoices
  try {
    const tFlow2Start = Date.now();
    await page.locator('a[href="/admissions"]').first().click();
    await page.waitForSelector('main', { state: 'visible' });
    await page.locator('a[href="/invoices"]').first().click();
    await page.waitForSelector('main', { state: 'visible' });
    const flow2Ms = Date.now() - tFlow2Start;
    results.transitions.push({
      flow: 'Enquiries -> Admissions -> Invoices',
      durationMs: flow2Ms,
      status: 'PASS',
    });
    console.log(`Flow 2 completed in ${flow2Ms}ms`);
  } catch (e: any) {
    results.transitions.push({
      flow: 'Enquiries -> Admissions -> Invoices',
      durationMs: 0,
      status: 'FAIL',
    });
  }

  // -------------------------------------------------------------
  // PHASE 11: RESPONSIVE VIEWPORT AUDIT
  // -------------------------------------------------------------
  console.log('\n--- PHASE 11: RESPONSIVE VIEWPORT AUDIT ---');
  const viewportsToTest = [
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Tablet', width: 1024, height: 768 },
    { name: 'Mobile', width: 390, height: 844 },
  ];

  for (const vp of viewportsToTest) {
    console.log(`Testing viewport: ${vp.name} (${vp.width}x${vp.height})`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const issues: string[] = [];
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalScroll) {
      issues.push('Horizontal overflow detected');
    }

    results.viewports.push({
      viewport: vp.name,
      width: vp.width,
      height: vp.height,
      passed: issues.length === 0,
      issues,
    });
    console.log(`  -> ${vp.name}: ${issues.length === 0 ? 'PASS (No horizontal overflow)' : 'ISSUES: ' + issues.join(', ')}`);
  }

  // Classify Console Errors
  for (const err of consoleErrors) {
    if (err.includes('ChunkLoadError') || err.includes('SyntaxError') || err.includes('Uncaught Exception')) {
      results.consoleErrorsSummary.critical.push(err);
    } else if (err.includes('404') || err.includes('500') || err.includes('TypeError')) {
      results.consoleErrorsSummary.high.push(err);
    } else if (err.includes('Warning:') || err.includes('validateDOMNesting')) {
      results.consoleErrorsSummary.medium.push(err);
    } else {
      results.consoleErrorsSummary.low.push(err);
    }
  }

  await browser.close();

  // Save audit results to file
  const reportPath = path.join(process.cwd(), 'docs', 'testing');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportPath, 'audit-results.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );

  console.log('\n==================================================');
  console.log('AUDIT COMPLETE. Results saved to docs/testing/audit-results.json');
  console.log('==================================================');
}

runAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
