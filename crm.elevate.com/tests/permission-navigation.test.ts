import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { ALL_FEATURE_MODULES, SOFTWARE_POSITIONS } from '../src/constants/permissions';
import { getFirstPermittedPath, getUserEffectivePermissions, hasFeatureAccess } from '../src/lib/permissions';
import { sessionLogoutUrl } from '../src/lib/session-logout';

function compile(file: string) {
  return ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
}

test('permissions editor loads existing selections when opened externally', () => {
  const states: unknown[] = [];
  const effects: Array<() => void> = [];
  let cursor = 0;
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  const exports: Record<string, any> = {};
  runInNewContext(compile('src/components/users/permissions-dialog.tsx'), {
    exports,
    require: (name: string) => {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react') return {
        useState: (initial: unknown) => {
          const slot = cursor++;
          if (!(slot in states)) states[slot] = initial;
          return [states[slot], (value: unknown) => { states[slot] = value; }];
        },
        useEffect: (effect: () => void) => effects.push(effect),
        useTransition: () => [false, () => {}],
      };
      if (name === 'next/navigation') return { useRouter: () => ({ refresh() {} }) };
      if (name === 'next-safe-action/hooks') return { useAction: () => ({ execute() {}, isExecuting: false }) };
      if (name === '@/constants/permissions') return { ALL_FEATURE_MODULES, SOFTWARE_POSITIONS };
      if (name === '@/lib/permissions') return { getUserEffectivePermissions };
      return new Proxy({}, { get: (_target, property) => String(property) });
    },
  });
  const render = (props: unknown) => { cursor = 0; return exports.PermissionsDialog(props); };
  render({ user: null, isOpen: false, onClose() {} });
  while (effects.length) effects.shift()!();
  const user = { id: 'telecaller-1', role: 'telecaller', userRole: { permissions: ['dashboard', 'enquiries', 'follow_ups', 'call_register'] } };
  render({ user, isOpen: true, onClose() {} });
  while (effects.length) effects.shift()!();
  assert.deepEqual(Array.from(states[1] as string[]), user.userRole.permissions);
  // Opening a different account must not retain the previous user's selections.
  render({ user: { id: 'user-2', role: 'executive', userRole: { permissions: ['invoices'] } }, isOpen: true, onClose() {} });
  while (effects.length) effects.shift()!();
  assert.equal(states[0], 'executive');
  assert.deepEqual(Array.from(states[1] as string[]), ['invoices']);
});

test('dashboard sends the reported permission set to Enquiries before fetching restricted data', async () => {
  const user = { id: 'telecaller-1', role: 'telecaller', userRole: { permissions: ['follow_ups', 'call_register', 'enquiries'] } };
  let dashboardCalls = 0;
  const exports: Record<string, any> = {};
  runInNewContext(compile('src/app/(sidebar)/dashboard/page.tsx'), {
    exports,
    require: (name: string) => {
      if (name === '@/lib/auth') return { auth: { api: { getSession: async () => ({ user }) } } };
      if (name === 'next/headers') return { headers: async () => new Headers() };
      if (name === 'next/navigation') return { redirect: (url: string) => { throw new Error('REDIRECT:' + url); }, unstable_rethrow: (error: unknown) => { throw error; } };
      if (name === '@/lib/permissions') return { getFirstPermittedPath, hasFeatureAccess };
      if (name === '@/lib/session-logout') return { sessionLogoutUrl };
      if (name === '@/lib/actions/dashboard') return { getDashboardData: async () => { dashboardCalls++; } };
      return {};
    },
  });
  await assert.rejects(exports.default(), { message: 'REDIRECT:/enquiries' });
  assert.equal(dashboardCalls, 0);
  assert.equal(getFirstPermittedPath({ role: 'telecaller' }), '/dashboard');
});
