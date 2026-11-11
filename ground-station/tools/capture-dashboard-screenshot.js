import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureIEEESnapshot() {
  console.log('🚀 Launching browser for IEEE Dashboard Snapshot...');
  const browser = await chromium.launch({
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2 // High DPI 2x scale for sharp text & charts in IEEE paper
  });

  const page = await context.newPage();
  
  console.log('🌐 Navigating to Ground Control Station Dashboard (http://localhost:3000/?autostart=true)...');
  await page.goto('http://localhost:3000/?autostart=true', { waitUntil: 'networkidle' });

  // Wait for 3D Rocket model, telemetry charts, and live data to stabilize
  console.log('⏳ Waiting for 3D model canvas, gauges, and telemetry charts to render...');
  await page.waitForTimeout(4000);

  const pngPath = path.join(__dirname, 'dashboard_ieee_snapshot.png');
  const jpgPath = path.join(__dirname, 'dashboard_ieee_snapshot.jpg');
  const cleanNamedPath = path.join(__dirname, 'IEEE_Paper_Dashboard_Snapshot.png');

  console.log('📸 Taking full-page IEEE paper snapshot...');
  await page.screenshot({
    path: pngPath,
    fullPage: true
  });

  await page.screenshot({
    path: jpgPath,
    type: 'jpeg',
    quality: 95,
    fullPage: true
  });

  fs.copyFileSync(pngPath, cleanNamedPath);

  console.log('✅ IEEE Snapshot saved successfully!');
  console.log('📁 PNG File:', pngPath);
  console.log('📁 JPG File:', jpgPath);
  console.log('📁 IEEE Paper Ready File:', cleanNamedPath);

  await browser.close();
}

captureIEEESnapshot().catch((err) => {
  console.error('❌ Error capturing snapshot:', err);
  process.exit(1);
});
