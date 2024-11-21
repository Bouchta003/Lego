const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

// Function to save data to a JSON file
const saveDataToFile = (data, filename) => {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`Data saved to ${filename}`);
    } catch (error) {
        console.error(`Error saving data to file: ${error.message}`);
    }
};

// Function to prompt the user for input
const getInput = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
    }));
};

(async () => {
    // Get the ID from the user
    const id = await getInput('Enter the ID to search: ');

    // Construct the dynamic URL and filename
    const url = `https://www.vinted.fr/catalog?search_text=${id}&time=1732213311&page=1`;
    const filename = `scraped_data_${id}.json`;

    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Go to the Vinted URL
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    try {
        // Wait for product grid items to load
        await page.waitForSelector('[data-testid="grid-item"]');

        // Scrape data
        const products = await page.evaluate(() => {
            // Select all product items
            const items = document.querySelectorAll('[data-testid="grid-item"]');
            const data = [];

            items.forEach(item => {
                const ownerElement = item.querySelector('[data-testid*="owner-name"]');
                const ownerName = ownerElement ? ownerElement.textContent.trim() : null;

                const ownerProfileElement = item.querySelector('[data-testid*="owner"] a');
                const ownerProfileLink = ownerProfileElement ? ownerProfileElement.href : null;

                const productImageElement = item.querySelector('[data-testid*="image--img"]');
                const productImage = productImageElement ? productImageElement.src : null;

                const productLinkElement = item.querySelector('[data-testid*="overlay-link"]');
                const productLink = productLinkElement ? productLinkElement.href : null;

                const priceElement = item.querySelector('[data-testid*="price-text"]');
                const price = priceElement ? priceElement.textContent.trim() : null;

                const titleElement = item.querySelector('[data-testid*="description-title"]');
                const title = titleElement ? titleElement.textContent.trim() : null;

                const sizeElement = item.querySelector('[data-testid*="description-subtitle"]');
                const size = sizeElement ? sizeElement.textContent.trim() : null;

                // Store the extracted data in an object
                data.push({
                    ownerName,
                    ownerProfileLink,
                    productImage,
                    productLink,
                    price,
                    title,
                    size
                });
            });

            return data;
        });

        // Save the scraped data to a JSON file
        saveDataToFile(products, filename);
    } catch (error) {
        console.error(`Error during scraping: ${error.message}`);
    } finally {
        // Close the browser
        await browser.close();
    }
})();
