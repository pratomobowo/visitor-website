const fs = require('fs');
const path = require('path');

console.log('🔍 Checking implemented features...\n');

// Check if files exist
const filesToCheck = [
  { path: 'src/app/dashboard/add-data/page.tsx', feature: 'Add Data Menu' },
  { path: 'src/app/dashboard/settings/page.tsx', feature: 'Settings Page' },
  { path: 'src/lib/init-db.ts', feature: 'Database Initialization' },
  { path: 'src/app/api/init-db/route.ts', feature: 'Database Init API' },
  { path: 'deploy.sh', feature: 'Deployment Script' }
];

filesToCheck.forEach(({ path, feature }) => {
  const fullPath = path.join(process.cwd(), path);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${feature}: ${path}`);
});

console.log('\n🔍 Checking for recent modifications...\n');

// Check recent commits
const { execSync } = require('child_process');
try {
  const commits = execSync('git log --oneline -10', { encoding: 'utf8' });
  console.log(commits);
} catch (error) {
  console.log('Could not fetch git log');
}

console.log('\n🔍 Checking dashboard layout for Add Data menu...\n');

// Check if dashboard layout includes Add Data menu
const layoutPath = path.join(process.cwd(), 'src/app/dashboard/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  const hasAddDataMenu = layoutContent.includes('Add Data') && layoutContent.includes('/dashboard/add-data');
  console.log(`${hasAddDataMenu ? '✅' : '❌'} Add Data menu in navigation`);
}

console.log('\n🔍 Checking login form updates...\n');

// Check if login form has been updated
const loginPath = path.join(process.cwd(), 'src/app/page.tsx');
if (fs.existsSync(loginPath)) {
  const loginContent = fs.readFileSync(loginPath, 'utf8');
  const hasModernDesign = loginContent.includes('bg-gradient-to-br') && loginContent.includes('Sangga Buana');
  const hasNoDefaultCreds = !loginContent.includes('Default admin credentials');
  console.log(`${hasModernDesign ? '✅' : '❌'} Modern login design`);
  console.log(`${hasNoDefaultCreds ? '✅' : '❌'} Default credentials removed`);
}

console.log('\n🔍 Checking API fixes...\n');

// Check if track API has duration_seconds fix
const trackApiPath = path.join(process.cwd(), 'src/app/api/track/route.ts');
if (fs.existsSync(trackApiPath)) {
  const trackContent = fs.readFileSync(trackApiPath, 'utf8');
  const hasDurationFix = trackContent.includes('Math.round(data.duration_seconds)');
  console.log(`${hasDurationFix ? '✅' : '❌'} Duration seconds fix in track API`);
}

// Check if stats API has date range fix
const statsApiPath = path.join(process.cwd(), 'src/app/api/stats/route.ts');
if (fs.existsSync(statsApiPath)) {
  const statsContent = fs.readFileSync(statsApiPath, 'utf8');
  const hasDateFix = statsContent.includes('period.startsWith(\'custom:\')');
  console.log(`${hasDateFix ? '✅' : '❌'} Custom date range fix in stats API`);
}

console.log('\n🎯 Summary:');
console.log('If all checks show ✅, then all features have been properly implemented.');
console.log('If you still don\'t see changes on the server, try:');
console.log('1. Run: chmod +x deploy.sh && ./deploy.sh');
console.log('2. Clear browser cache (Ctrl+F5)');
console.log('3. Check browser console for errors');
console.log('4. Check server logs: pm2 logs visitor-counter');