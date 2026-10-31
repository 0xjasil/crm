import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

function sourceFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sourceFiles(path.join(folder, entry.name)) : [path.join(folder, entry.name)]);
}

test('frontend source has no database client, database URL or raw database queries', () => {
  for (const file of sourceFiles(path.resolve('src')).filter(file => /\.(ts|tsx)$/.test(file))) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /@prisma\/client|PrismaClient|from ['"][^'"]*lib\/prisma|process\.env\.(DATABASE_URL|POSTGRES\w*)|\$queryRaw|\$executeRaw/, file);
  }
  assert.equal(existsSync('src/lib/prisma.ts'), false);
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.dependencies['@prisma/client'], undefined);
  assert.equal(pkg.devDependencies.prisma, undefined);
  assert.doesNotMatch(readFileSync('scripts/build.js', 'utf8'), /prisma|DATABASE_URL|POSTGRES/);
});

test('server sessions come from the verified Fastify endpoint', () => {
  const source = readFileSync('src/lib/auth.ts', 'utf8');
  assert.match(source, /backendRequest[\s\S]*['"]\/auth\/me['"]/);
  assert.doesNotMatch(source, /jwt\.decode|jwt\.verify|cookieUserData/);
});
