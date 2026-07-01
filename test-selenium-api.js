#!/usr/bin/env node
// Test script for Selenium QA
// Tests the backend API directly

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testSelenium() {
  console.log(`Testing Selenium generation via ${API_URL}/generate\n`);

  const res = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-license-key': 'VALID-KEY'
    },
    body: JSON.stringify({
      ticket_id: 'SCRUM-5',
      title: 'Login Feature',
      description: 'Test login flow with valid credentials. AC: 1) User enters valid email/password, 2) Clicks login button, 3) Redirected to dashboard, 4) Success message shown.',
      framework: 'selenium'
    })
  });

  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('API success:', data.success);
  console.log('Filename:', data.filename);

  if (data.code) {
    console.log('\n--- Generated Code ---');
    console.log(data.code);
    console.log('--- End of Code ---\n');
  } else if (data.error) {
    console.log('API Error:', data.error);
    console.log('Message:', data.message);
  }

  // Verify checks
  console.log('\n=== VERIFICATION ===');
  console.log('1. Filename is .java:', data.filename?.endsWith('.java') ? 'PASS' : 'FAIL');
  console.log('2. Code contains @Test:', data.code?.includes('@Test') ? 'PASS' : 'FAIL');
  console.log('3. Code contains WebDriver:', data.code?.includes('WebDriver') || data.code?.includes('driver') ? 'PASS' : 'FAIL');
  console.log('4. Code contains org.openqa.selenium:', data.code?.includes('org.openqa.selenium') ? 'PASS' : 'FAIL');
  console.log('5. Code contains By. locators:', data.code?.includes('By.') || data.code?.includes('By\\.') ? 'PASS' : 'FAIL');
}

testSelenium().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});