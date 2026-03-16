#!/usr/bin/env node

/**
 * GitHub Deployment Cleanup Script
 * Deletes old deployment records and environments from GitHub
 * 
 * Usage: node scripts/cleanup-github.js <github-token> <owner> <repo> [--keep-count N] [--dry-run]
 */

async function listDeployments(token, owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/deployments?per_page=100`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to list deployments: ${response.status}`);
  }
  
  const data = await response.json();
  return data || [];
}

async function listEnvironments(token, owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/environments`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to list environments: ${response.status}`);
  }
  
  const data = await response.json();
  return data.environments || [];
}

async function deleteDeployment(token, owner, repo, deploymentId) {
  const url = `https://api.github.com/repos/${owner}/${repo}/deployments/${deploymentId}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  
  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete deployment ${deploymentId}: ${response.status}`);
  }
  
  return true;
}

async function deleteEnvironment(token, owner, repo, environment) {
  const url = `https://api.github.com/repos/${owner}/${repo}/environments/${environment}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  
  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete environment ${environment}: ${response.status}`);
  }
  
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const keepCountIdx = args.indexOf('--keep-count');
  const keepCount = (keepCountIdx >= 0 && args[keepCountIdx + 1]) ? parseInt(args[keepCountIdx + 1]) : 5;
  const nonFlagArgs = args.filter(a => a !== '--dry-run' && a !== '--keep-count' && a !== args[keepCountIdx + 1]);
  
  if (nonFlagArgs.length < 3) {
    console.error('Usage: node scripts/cleanup-github.js <token> <owner> <repo> [--keep-count N] [--dry-run]');
    console.error('Example: node scripts/cleanup-github.js gh_abc123 danniel0976 twylm --keep-count 5 --dry-run');
    process.exit(1);
  }
  
  const token = nonFlagArgs[0];
  const owner = nonFlagArgs[1];
  const repo = nonFlagArgs[2];
  
  console.log('🔍 Scanning GitHub deployments...');
  const deployments = await listDeployments(token, owner, repo);
  console.log(`📊 Found ${deployments.length} deployments`);
  
  console.log('\n🔍 Scanning GitHub environments...');
  const environments = await listEnvironments(token, owner, repo);
  console.log(`📊 Found ${environments.length} environments`);
  
  if (deployments.length === 0 && environments.length === 0) {
    console.log('✨ Nothing to clean!');
    return;
  }
  
  // Sort deployments by created_at (newest first)
  const sorted = deployments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // Keep only the latest N deployments
  const toKeep = sorted.slice(0, keepCount);
  const toDelete = sorted.slice(keepCount);
  
  console.log(`\n📋 Keeping ${keepCount} latest deployments:`);
  toKeep.forEach((d, i) => {
    const date = new Date(d.created_at).toLocaleString();
    console.log(`  ${i + 1}. ${d.sha.substring(0, 7)} - ${d.environment || 'N/A'} - ${d.task} - ${date}`);
  });
  
  console.log(`\n🗑️  Will delete ${toDelete.length} old deployments:`);
  toDelete.forEach((d, i) => {
    const date = new Date(d.created_at).toLocaleString();
    console.log(`  ${i + 1}. ${d.sha.substring(0, 7)} - ${d.environment || 'N/A'} - ${d.task} - ${date}`);
  });
  
  if (environments.length > 0) {
    console.log(`\n🗑️  Will delete ${environments.length} environments:`);
    environments.forEach((env, i) => {
      const date = new Date(env.created_at).toLocaleString();
      console.log(`  ${i + 1}. ${env.name} - ${date}`);
    });
  }
  
  if (dryRun) {
    console.log('\n🔍 Dry run - no deletions made');
    return;
  }
  
  console.log('\n❓ Continue? (y/n): ');
  
  const answer = await new Promise(resolve => {
    process.stdin.resume();
    process.stdin.once('data', data => {
      resolve(data.toString().trim().toLowerCase());
    });
  });
  
  if (answer !== 'y' && answer !== 'yes') {
    console.log('❌ Cancelled');
    process.exit(0);
  }
  
  console.log('\n🗑️  Deleting deployments...\n');
  
  let delSuccess = 0;
  let delFailed = 0;
  
  for (const deployment of toDelete) {
    process.stdout.write(`  Deleting ${deployment.sha.substring(0, 7)}... `);
    try {
      await deleteDeployment(token, owner, repo, deployment.id);
      console.log('✅');
      delSuccess++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
      delFailed++;
    }
  }
  
  if (environments.length > 0) {
    console.log('\n🗑️  Deleting environments...\n');
    
    let envSuccess = 0;
    let envFailed = 0;
    
    for (const env of environments) {
      process.stdout.write(`  Deleting ${env.name}... `);
      try {
        await deleteEnvironment(token, owner, repo, env.name);
        console.log('✅');
        envSuccess++;
      } catch (err) {
        console.log(`❌ ${err.message}`);
        envFailed++;
      }
    }
    
    console.log(`\n✨ Environments: ${envSuccess} deleted, ${envFailed} failed`);
  }
  
  console.log(`\n✨ Deployments: ${delSuccess} deleted, ${delFailed} failed`);
  console.log(`📊 Remaining: ${toKeep.length} deployments`);
  console.log('💡 GitHub will recreate environments automatically on next deployment');
}

main().catch(err => {
  console.error('💥 Error:', err.message);
  process.exit(1);
});
