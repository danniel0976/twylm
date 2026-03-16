#!/usr/bin/env node

/**
 * Vercel Deployment Cleanup Script
 * Deletes failed and redundant deployments, keeping only the latest successful one per environment
 * 
 * Usage: node scripts/cleanup-vercel.js <token> [teamId] <project-name> [--dry-run]
 */

async function listDeployments(token, teamId, projectId) {
  const url = teamId
    ? `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=100`
    : `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=100`;
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to list deployments: ${response.status}`);
  }
  
  const data = await response.json();
  return data.deployments || [];
}

async function deleteDeployment(token, teamId, deploymentId) {
  const url = teamId
    ? `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${teamId}`
    : `https://api.vercel.com/v13/deployments/${deploymentId}`;
    
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete ${deploymentId}: ${response.status}`);
  }
  
  return true;
}

async function getProjectId(token, teamId, projectName) {
  const url = teamId
    ? `https://api.vercel.com/v9/projects/team/${teamId}`
    : `https://api.vercel.com/v9/projects`;
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to list projects: ${response.status}`);
  }
  
  const data = await response.json();
  const project = data.projects.find(p => p.name === projectName);
  
  if (!project) {
    throw new Error(`Project "${projectName}" not found`);
  }
  
  return project.id;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const nonFlagArgs = args.filter(a => a !== '--dry-run');
  
  if (nonFlagArgs.length < 2) {
    console.error('Usage: node scripts/cleanup-vercel.js <token> [teamId] <projectName> [--dry-run]');
    console.error('Example: node scripts/cleanup-vercel.js vc_abc123 twylm --dry-run');
    process.exit(1);
  }
  
  const token = nonFlagArgs[0];
  const projectName = nonFlagArgs[nonFlagArgs.length - 1];
  const teamId = nonFlagArgs.length === 3 ? nonFlagArgs[1] : '';
  
  console.log('🔍 Finding project...');
  const projectId = await getProjectId(token, teamId, projectName);
  console.log(`✅ Found project: ${projectName} (${projectId})`);
  
  console.log('📋 Fetching deployments...');
  const deployments = await listDeployments(token, teamId, projectId);
  console.log(`📊 Found ${deployments.length} deployments`);
  
  // Categorize deployments
  const ready = deployments.filter(d => d.state === 'READY');
  const failed = deployments.filter(d => d.state === 'ERROR' || d.state === 'CANCELED');
  const building = deployments.filter(d => d.state === 'BUILDING' || d.state === 'INITIALIZING');
  
  console.log(`\n📈 Status breakdown:`);
  console.log(`  ✅ Ready: ${ready.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);
  console.log(`  🔄 Building: ${building.length}`);
  
  if (deployments.length === 0) {
    console.log('✨ No deployments to clean!');
    return;
  }
  
  // Keep only the latest READY deployment
  const latestReady = ready.length > 0 ? ready.sort((a, b) => b.createdAt - a.createdAt)[0] : null;
  
  const toDelete = deployments.filter(d => {
    // Keep latest ready deployment
    if (d.uid === latestReady?.uid) return false;
    // Delete all failed/canceled
    if (d.state === 'ERROR' || d.state === 'CANCELED') return true;
    // Delete older ready deployments
    if (d.state === 'READY' && d.uid !== latestReady?.uid) return true;
    return false;
  });
  
  console.log(`\n🗑️  Will delete ${toDelete.length} deployments:`);
  toDelete.forEach((d, i) => {
    const date = new Date(d.createdAt).toLocaleString();
    const reason = d.uid === latestReady?.uid ? 'KEEPING' : d.state === 'ERROR' ? 'failed' : 'redundant';
    console.log(`  ${i + 1}. ${d.uid} - ${d.state} - ${reason} - ${date}`);
  });
  
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
  
  console.log('\n🗑️  Deleting...\n');
  
  let delSuccess = 0;
  let delFailed = 0;
  
  for (const deployment of toDelete) {
    process.stdout.write(`  Deleting ${deployment.uid}... `);
    try {
      await deleteDeployment(token, teamId, deployment.uid);
      console.log('✅');
      delSuccess++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
      delFailed++;
    }
  }
  
  console.log(`\n✨ Done! ${delSuccess} deleted, ${delFailed} failed`);
  console.log(`📊 Remaining: ${deployments.length - toDelete.length} deployments`);
}

main().catch(err => {
  console.error('💥 Error:', err.message);
  process.exit(1);
});
