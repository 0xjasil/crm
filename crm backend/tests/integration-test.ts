const BASE_URL = 'http://localhost:5000';

interface TestResult {
  name: string;
  durationMs: number;
  status: 'PASS' | 'FAIL';
  error?: string;
}

async function runTestsWithTiming() {
  console.log('================================================================');
  console.log('⏱️  CRM BACKEND PERFORMANCE & RESPONSE TIME BENCHMARK');
  console.log('================================================================\n');

  const results: TestResult[] = [];
  const suiteStartTime = performance.now();

  async function test(name: string, fn: () => Promise<void>) {
    const start = performance.now();
    try {
      await fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      results.push({ name, durationMs, status: 'PASS' });
      console.log(`✅ [${durationMs.toFixed(2).padStart(7)} ms] PASS: ${name}`);
    } catch (err: any) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      results.push({ name, durationMs, status: 'FAIL', error: err.message });
      console.error(`❌ [${durationMs.toFixed(2).padStart(7)} ms] FAIL: ${name} (${err.message})`);
    }
  }

  // 1. Health
  await test('GET /health (Liveness)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'ok') throw new Error('Health check failed');
  });

  await test('GET /health/ready (PostgreSQL Query Probe)', async () => {
    const res = await fetch(`${BASE_URL}/health/ready`);
    const data = await res.json();
    if (res.status !== 200 || data.database !== 'connected') throw new Error('DB readiness probe failed');
  });

  // 2. Auth
  let token = '';
  await test('POST /api/v1/auth/login (Admin Auth & JWT Signing)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@elevate.com', password: 'Admin@123' }),
    });
    const data = await res.json();
    if (!data.success || !data.data?.token) throw new Error('Login failed');
    token = data.data.token;
  });

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  await test('GET /api/v1/auth/me (Session Verification)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error('Auth check failed');
  });

  // 3. Master Data
  let branchId = '';
  await test('GET /api/v1/branches (Query Branches)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/branches`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success || !data.data.length) throw new Error('List branches failed');
    branchId = data.data[0].id;
  });

  let courseId = '';
  await test('POST /api/v1/courses (Create Course)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/courses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: `Course ${Date.now()}`,
        duration: '6 Months',
        courseFee: 40000,
        admissionFee: 5000,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error('Create course failed');
    courseId = data.data.id;
  });

  await test('GET /api/v1/enquiry-sources (List Sources)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/enquiry-sources`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error('List sources failed');
  });

  // 4. Enquiries
  let enquiryId = '';
  await test('POST /api/v1/enquiries (Create Enquiry)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/enquiries`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        candidateName: 'Benchmark Candidate',
        phone: '+91 9123456780',
        email: 'bench@example.com',
        branchId,
        preferredCourseId: courseId,
        source: 'Website',
        status: 'NEW',
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error('Create enquiry failed');
    enquiryId = data.data.id;
  });

  await test('GET /api/v1/enquiries (List Paginated Enquiries)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/enquiries?page=1&limit=20`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error('List enquiries failed');
  });

  await test('POST /api/v1/enquiries/:id/status (Transition Status)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/enquiries/${enquiryId}/status`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'INTERESTED', remarks: 'Benchmark status change' }),
    });
    const data = await res.json();
    if (!data.success) throw new Error('Status transition failed');
  });

  // 5. Follow-ups
  await test('POST /api/v1/follow-ups (Schedule Follow-Up)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/follow-ups`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        enquiryId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Benchmark call',
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error('Schedule follow-up failed');
  });

  // 6. Call Logs
  await test('POST /api/v1/call-logs (Log Phone Call)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/call-logs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        enquiryId,
        duration: 3,
        outcome: 'Answered',
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error('Call log failed');
  });

  await test('GET /api/v1/call-logs/stats (Calculate Call Metrics)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/call-logs/stats`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error('Call stats failed');
  });

  // 7. Admissions
  let admissionId = '';
  await test('POST /api/v1/admissions (Create Admission with Initial Receipt Tx)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admissions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        candidateName: 'Benchmark Student',
        mobileNumber: '+91 9123456780',
        address: 'Bangalore',
        courseId,
        enquiryId,
        initialPayment: {
          amount: 5000,
          collectedTowards: 'ADMISSION_FEE',
          paymentMode: 'Cash',
        },
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error('Admission failed');
    admissionId = data.data.id;
  });

  // 8. Receipts & Fee Collection
  let receiptId = '';
  await test('POST /api/v1/receipts (Collect Fee + Decrement Balance Tx)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/receipts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        admissionId,
        courseId,
        amountCollected: 10000,
        collectedTowards: 'COURSE_FEE',
        paymentMode: 'UPI',
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error('Receipt creation failed');
    receiptId = data.data.id;
  });

  await test('GET /api/v1/receipts/:id/pdf (Generate & Stream Receipt PDF)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/receipts/${receiptId}/pdf`, { headers: authHeaders() });
    if (res.status !== 200) throw new Error('Receipt PDF failed');
    await res.arrayBuffer();
  });

  // 9. Invoices
  let invoiceId = '';
  await test('POST /api/v1/invoices (Multi-Item Invoice + Tax Calculation Tx)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/invoices`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        billedTo: 'Benchmark Client',
        items: [
          { itemDescription: 'Item A', quantity: 2, unitPrice: 5000 },
          { itemDescription: 'Item B', quantity: 1, unitPrice: 12000 },
        ],
        taxRate: 0.18,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error('Invoice failed');
    invoiceId = data.data.id;
  });

  await test('GET /api/v1/invoices/:id/pdf (Generate & Stream Invoice PDF)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/invoices/${invoiceId}/pdf`, { headers: authHeaders() });
    if (res.status !== 200) throw new Error('Invoice PDF failed');
    await res.arrayBuffer();
  });

  // 10. Expenses
  await test('POST /api/v1/expenses (Log Expense)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/expenses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Benchmark Expense',
        amount: 1500,
        category: 'OFFICE_SUPPLIES',
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error('Expense failed');
  });

  await test('GET /api/v1/expenses/summary (Aggregate Expense Breakdown)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/expenses/summary`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error('Expense summary failed');
  });

  // 11. Dashboard & Reports
  await test('GET /api/v1/dashboard/stats (Aggregated Metrics & Financials)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard/stats`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error('Dashboard stats failed');
  });

  await test('GET /api/v1/reports/telecaller (Telecaller Performance Analysis)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/reports/telecaller`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error('Telecaller report failed');
  });

  await test('GET /api/v1/reports/payments (Admission Payments Analysis)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/reports/payments`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error('Payment report failed');
  });

  const totalTimeMs = Math.round((performance.now() - suiteStartTime) * 100) / 100;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const avgTimeMs = Math.round((results.reduce((sum, r) => sum + r.durationMs, 0) / results.length) * 100) / 100;
  const sorted = [...results].sort((a, b) => a.durationMs - b.durationMs);

  console.log('\n================================================================');
  console.log('📊 BENCHMARK & TIMING SUMMARY');
  console.log('================================================================');
  console.log(`⏱️  Total Test Execution Time: ${totalTimeMs.toFixed(2)} ms (${(totalTimeMs / 1000).toFixed(2)}s)`);
  console.log(`⚡ Average Latency per API Request: ${avgTimeMs.toFixed(2)} ms`);
  console.log(`🚀 Fastest Request: [${sorted[0].durationMs.toFixed(2)} ms] ${sorted[0].name}`);
  console.log(`🐢 Slowest Request: [${sorted[sorted.length - 1].durationMs.toFixed(2)} ms] ${sorted[sorted.length - 1].name}`);
  console.log(`🏁 Results: ${passed} Passed, ${failed} Failed out of ${results.length} total tests`);
  console.log('================================================================\n');
}

runTestsWithTiming().catch(console.error);