import fs from 'fs';
import path from 'path';
import execa from 'execa';

function getAllSpecs(dir = 'cypress/e2e') {
  let specs = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      specs = specs.concat(getAllSpecs(fullPath));
    } else if (
      (entry.name.endsWith('_spec.js') || entry.name.includes('spec')) &&
      entry.name.endsWith('.js')
    ) {
      if (!entry.name.includes('spec_utils')) {
        specs.push(fullPath);
      }
    }
  }
  return specs.sort();
}

function getShardSpecs(allSpecs, shardIndex, shardTotal) {
  if (!shardIndex || !shardTotal || shardTotal <= 1) {
    return allSpecs;
  }
  const index = parseInt(shardIndex, 10) - 1; // 1-indexed (e.g. 1 to 4)
  const total = parseInt(shardTotal, 10);
  return allSpecs.filter((_, i) => i % total === index);
}

async function runCypress() {
  const args = ['run', '--browser', 'chrome', '--headless'];

  // Handle sharding via environment variables or CLI arguments
  const shardIndex = process.env.SHARD_INDEX;
  const shardTotal = process.env.SHARD_TOTAL;

  if (shardIndex && shardTotal) {
    const allSpecs = getAllSpecs();
    const shardSpecs = getShardSpecs(allSpecs, shardIndex, shardTotal);
    console.log(
      `Running Shard ${shardIndex}/${shardTotal} (${shardSpecs.length} of ${allSpecs.length} specs)`,
    );
    args.push('--spec', shardSpecs.join(','));
  }

  if (process.env.CYPRESS_RECORD_KEY) {
    const isPR = process.env.GITHUB_EVENT_NAME === 'pull_request';
    const tags = ['ci'];
    if (isPR) tags.push('pr');
    if (process.env.GITHUB_BASE_REF) tags.push(`base:${process.env.GITHUB_BASE_REF}`);
    if (shardIndex && shardTotal) tags.push(`shard:${shardIndex}/${shardTotal}`);

    args.push('--record', '--group', isPR ? 'PR Checks' : 'GitHub CI', '--tag', tags.join(','));
  }

  console.log('Running Cypress with args:', args.join(' '));
  await execa('cypress', args, {
    stdio: 'inherit',
    preferLocal: true,
    timeout: 15 * 60 * 1000,
  });
}

runCypress();
