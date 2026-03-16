#!/usr/bin/env node

/**
 * Vercel Deployment Cleanup Script
 * Deletes all deployments for a project
 * Uses native fetch (Node 18+)
 * 
 * Usage: node scripts/delete-deployments.js <vercel-token> [team-id] <project-name> [--force]
 */

async function listDeployments(token, teamId, projectId) {
  const url = teamId
    ? `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${teamId}`
    : `https://api.vercel.com/v6/deployments?projectId=${projectId}`;
    
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
  const force = args.includes('--force');
  const nonFlagArgs = args.filter(a => a !== '--force');
  
  if (nonFlagArgs.length < 2) {
    console.error('Usage: node scripts/delete-deployments.js <token> [teamId] <projectName> [--force]');
    console.error('Example: node scripts/delete-deployments.js vc_abc123 twylm');
    console.error('With team: node scripts/delete-deployments.js vc_abc123 team_abc123 twylm --force');
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
  
  if (deployments.length === 0) {
    console.log('✨ No deployments to delete!');
    return;
  }
  
  if (!force) {
    console.log('\n⚠️  About to delete these deployments:');
    deployments.forEach((d, i) => {
      const date = new Date(d.createdAt).toLocaleString();
      console.log(`  ${i + 1}. ${d.uid} - ${d.state} - ${date}`);
    });
    
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
  }
  
  console.log('\n🗑️  Deleting...\n');
  
  let success = 0;
  let failed = 0;
  
  for (const deployment of deployments) {
    process.stdout.write(`  Deleting ${deployment.uid}... `);
    try {
      await deleteDeployment(token, teamId, deployment.uid);
      console.log('✅');
      success++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n✨ Done! ${success} deleted, ${failed} failed`);
}

main().catch(err => {
  console.error('💥 Error:', err.message);
  process.exit(1);
});
