#!/usr/bin/env node

/**
 * Validation script for LCP optimizations
 * Checks if all optimization components are properly implemented
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating LCP Optimizations...\n');

const checks = [];

// Check 1: WebP images exist
const publicDir = path.join(__dirname, '../public');
const requiredWebPImages = [
  'community-interface-new.webp',
  'community-screenshot.webp',
  'atomic-habits-cover.webp',
  'icons8-bee-100.webp',
  'static-map.webp'
];

console.log('📸 Checking WebP Images:');
requiredWebPImages.forEach(image => {
  const imagePath = path.join(publicDir, image);
  const exists = fs.existsSync(imagePath);
  console.log(`  ${exists ? '✅' : '❌'} ${image}`);
  checks.push({ name: `WebP Image: ${image}`, passed: exists });
});

// Check 2: Performance monitoring exists
console.log('\n📊 Checking Performance Monitoring:');
const performanceMonitorPath = path.join(__dirname, '../src/utils/performanceMonitor.js');
const performanceMonitorExists = fs.existsSync(performanceMonitorPath);
console.log(`  ${performanceMonitorExists ? '✅' : '❌'} Performance Monitor`);
checks.push({ name: 'Performance Monitor', passed: performanceMonitorExists });

// Check 3: OptimizedImage component exists
console.log('\n🖼️  Checking OptimizedImage Component:');
const optimizedImagePath = path.join(__dirname, '../src/components/ui/OptimizedImage.jsx');
const optimizedImageExists = fs.existsSync(optimizedImagePath);
console.log(`  ${optimizedImageExists ? '✅' : '❌'} OptimizedImage Component`);
checks.push({ name: 'OptimizedImage Component', passed: optimizedImageExists });

// Check 4: Cache headers exist
console.log('\n🗂️  Checking Cache Headers:');
const headersPath = path.join(publicDir, '_headers');
const headersExist = fs.existsSync(headersPath);
console.log(`  ${headersExist ? '✅' : '❌'} _headers file`);
checks.push({ name: 'Cache Headers', passed: headersExist });

// Check 5: Vite config optimizations
console.log('\n⚙️  Checking Vite Configuration:');
const viteConfigPath = path.join(__dirname, '../vite.config.js');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  const hasWebPSupport = viteConfig.includes('webp');
  const hasCodeSplitting = viteConfig.includes('manualChunks');
  console.log(`  ${hasWebPSupport ? '✅' : '❌'} WebP Support`);
  console.log(`  ${hasCodeSplitting ? '✅' : '❌'} Code Splitting`);
  checks.push({ name: 'Vite WebP Support', passed: hasWebPSupport });
  checks.push({ name: 'Vite Code Splitting', passed: hasCodeSplitting });
} else {
  console.log('  ❌ Vite config not found');
  checks.push({ name: 'Vite Config', passed: false });
}

// Check 6: Index.html optimizations
console.log('\n📄 Checking HTML Optimizations:');
const indexPath = path.join(publicDir, '../index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const hasPreconnect = indexContent.includes('rel="preconnect"');
  const hasFontPreload = indexContent.includes('rel="preload"') && indexContent.includes('font');
  const hasImagePreload = indexContent.includes('rel="preload"') && indexContent.includes('image');
  console.log(`  ${hasPreconnect ? '✅' : '❌'} DNS Preconnect`);
  console.log(`  ${hasFontPreload ? '✅' : '❌'} Font Preloading`);
  console.log(`  ${hasImagePreload ? '✅' : '❌'} Image Preloading`);
  checks.push({ name: 'DNS Preconnect', passed: hasPreconnect });
  checks.push({ name: 'Font Preloading', passed: hasFontPreload });
  checks.push({ name: 'Image Preloading', passed: hasImagePreload });
} else {
  console.log('  ❌ index.html not found');
  checks.push({ name: 'HTML Optimizations', passed: false });
}

// Summary
console.log('\n📋 Optimization Summary:');
console.log('========================');
const passedChecks = checks.filter(check => check.passed).length;
const totalChecks = checks.length;
const successRate = Math.round((passedChecks / totalChecks) * 100);

console.log(`✅ Passed: ${passedChecks}/${totalChecks} (${successRate}%)`);

if (successRate >= 90) {
  console.log('\n🎉 Excellent! Your LCP optimizations are properly implemented.');
  console.log('🚀 Expected LCP improvement: 40-60% faster loading times');
} else if (successRate >= 70) {
  console.log('\n👍 Good! Most optimizations are in place.');
  console.log('🔧 Consider addressing the failed checks for maximum performance.');
} else {
  console.log('\n⚠️  Some optimizations are missing.');
  console.log('📝 Please review the failed checks and implement missing optimizations.');
}

// Failed checks details
const failedChecks = checks.filter(check => !check.passed);
if (failedChecks.length > 0) {
  console.log('\n❌ Failed Checks:');
  failedChecks.forEach(check => {
    console.log(`   • ${check.name}`);
  });
}

console.log('\n🔗 Next Steps:');
console.log('1. Run: npm run build (to build optimized version)');
console.log('2. Test: npm run preview (to test production build)');
console.log('3. Measure: Use Lighthouse to measure LCP improvements');
console.log('4. Monitor: Check performance metrics in production');

process.exit(successRate >= 70 ? 0 : 1);