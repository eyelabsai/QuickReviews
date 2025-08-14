// Quick script to update all timing values from 3 days to 1 minute for testing
const fs = require('fs');
const path = require('path');

console.log('⚡ Updating timing from 3 days to 1 minute for testing...\n');

// Files to update
const files = [
  '../dashboard.html',
  'test-tracking-fixed.js',
  'test-tracking-simple.js',
  'auto-resend.js'
];

files.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace 3 days with 1 minute
      const oldPattern = /3 \* 24 \* 60 \* 60 \* 1000/g;
      const newPattern = '1 * 60 * 1000';
      
      if (content.includes('3 * 24 * 60 * 60 * 1000')) {
        content = content.replace(oldPattern, newPattern);
        
        // Update comments
        content = content.replace(/\/\/ 3 days from now/g, '// 1 minute from now (for testing)');
        content = content.replace(/\/\/ 3 days/g, '// 1 minute (for testing)');
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
      } else {
        console.log(`⏭️  No changes needed: ${filePath}`);
      }
    } else {
      console.log(`❌ File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log('\n🎯 All files updated! Now review links will expire in 1 minute for testing.');
console.log('\n📋 Next steps:');
console.log('   1. Send a test review request through your dashboard');
console.log('   2. Wait 1 minute for it to expire');
console.log('   3. Run the auto-resend script to test resending');
console.log('   4. Change back to 3 days when testing is complete');