const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/inspire.html');
  await page.waitForTimeout(2000);
  
  // Check DOM structure
  const mainExists = await page.$('.main');
  const sidebarExists = await page.$('.sidebar');
  const contentExists = await page.$('.content');
  const taskContentExists = await page.$('#task-content');
  
  console.log('.main exists:', !!mainExists);
  console.log('.sidebar exists:', !!sidebarExists);
  console.log('.content exists:', !!contentExists);
  console.log('#task-content exists:', !!taskContentExists);
  
  // Check content area dimensions
  const contentBox = await page.evaluate(() => {
    const el = document.querySelector('.content');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 };
  });
  console.log('.content dimensions:', contentBox);
  
  // Check if task-content has content
  const taskContent = await page.evaluate(() => {
    const el = document.getElementById('task-content');
    return el ? { innerHTML: el.innerHTML.substring(0, 100), hasContent: el.children.length > 0 || el.innerHTML.trim().length > 0 } : null;
  });
  console.log('#task-content has content:', taskContent);
  
  await browser.close();
})();
