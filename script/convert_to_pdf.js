const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const puppeteer = require("puppeteer");

async function convert_to_pdf(page, eno, pdf_path) {
  await page.goto("http://localhost:5775");
  await page.waitForSelector('.more_vert');
  await page.evaluate(() => document.querySelector('.more_vert').click());
  await page.waitForSelector('.edit');
  await page.evaluate(() => document.querySelector('.edit').click());
  await page.waitForSelector('#crossword-source');
  await page.evaluate((eno) => {
      document.querySelector('#crossword-source').value = eno;
  }, eno);
  await page.type('#crossword-source', '\n');
  await page.waitFor(2000);
  await page.waitForSelector('.print');
  await page.evaluate(() => document.querySelector('.print').click());
  // await page.waitForSelector('.more_vert');
  await page.pdf({
    path: pdf_path,
    format: "A4",
    scale: 0.95,
    margin: {top: '1cm', left: '1cm', right: '1cm', bottom: '1cm'}
  });
  await page.waitFor(2000);
}

async function convert_all() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080
    });
    fs.readdir(dir, async (err, files) => {
        if (err) {
            console.log(err);
        }
        for (const source of files) {
            if (!source.endsWith('.eno'))
                continue;
            const eno = fs.readFileSync(path.join(dir, source), 'utf8').toString();
            const pdf_path = path.join(dir, path.basename(source, '.eno') + '-anagrind.pdf');
            console.log(pdf_path);
            await convert_to_pdf(page, eno, pdf_path)
        };
    });
}

convert_all();


