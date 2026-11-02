const { execFileSync } = require('node:child_process');
execFileSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], { stdio: 'inherit' });
