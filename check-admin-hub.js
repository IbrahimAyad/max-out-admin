const { chromium } = require('/Users/ibrahim/Library/Caches/ms-playwright/chromium-1187/chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium');

// Use Playwright's installed browsers
const { spawn } = require('child_process');
const fs = require('fs');

async function checkAdminHub() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Checking Admin Hub at: https://max-out-admin-hub.vercel.app');
  
  try {
    // Navigate to the admin hub
    const response = await page.goto('https://max-out-admin-hub.vercel.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('📊 Status:', response.status());
    console.log('📝 Status Text:', response.statusText());
    
    // Wait a moment for any JavaScript to load
    await page.waitForTimeout(3000);
    
    // Get the page title
    const title = await page.title();
    console.log('📄 Page Title:', title);
    
    // Check if there are any error messages visible
    const errorMessages = await page.locator('text=/error|Error|ERROR/i').count();
    console.log('❌ Error messages found:', errorMessages);
    
    // Check for loading states
    const loadingElements = await page.locator('text=/loading|Loading|LOADING/i').count();
    console.log('⏳ Loading elements found:', loadingElements);
    
    // Get the main content
    const bodyText = await page.locator('body').textContent();
    const firstChars = bodyText.substring(0, 200);
    console.log('📋 First 200 characters of content:', firstChars);
    
    // Check for authentication/login forms
    const loginForms = await page.locator('input[type="email"], input[type="password"], button[type="submit"]').count();
    console.log('🔐 Login form elements found:', loginForms);
    
    // Check for main navigation or dashboard elements
    const dashboardElements = await page.locator('text=/dashboard|inventory|admin|menu/i').count();
    console.log('📊 Dashboard elements found:', dashboardElements);
    
    // Check for any React/JavaScript errors in console
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log('🚨 Console Errors:');
      consoleLogs.forEach(log => console.log(log));
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Check specific elements that should be present
    const specificChecks = {
      'React root': await page.locator('#root').count(),
      'Vite scripts': await page.locator('script[type="module"]').count(),
      'CSS files': await page.locator('link[rel="stylesheet"]').count(),
      'Any buttons': await page.locator('button').count(),
      'Any inputs': await page.locator('input').count()
    };
    
    console.log('🔍 Specific element checks:');
    Object.entries(specificChecks).forEach(([name, count]) => {
      console.log(`  ${name}: ${count}`);
    });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: '/Users/ibrahim/max-out-admin/max-out-admin/admin-hub-screenshot.png' });
    console.log('📸 Screenshot saved as admin-hub-screenshot.png');
    
  } catch (error) {
    console.error('💥 Error accessing page:', error.message);
    console.error('🔍 Error details:', error);
  } finally {
    await browser.close();
  }
}

checkAdminHub().catch(console.error);