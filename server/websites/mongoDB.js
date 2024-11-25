const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
const { MongoClient } = require('mongodb');

// MongoDB Configuration
const MONGODB_URI = 'mongodb+srv://bouchtaben003:xgwfWbIurQzptItf@cluster0.7dth8.mongodb.net/?retryWrites=true&writeConcern=majority';
const MONGODB_DB_NAME = 'Lego';

const saveDataToFile = (data, filename) => {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`Data saved to ${filename}`);
    } catch (error) {
        console.error(`Error saving data to file: ${error.message}`);
    }
};

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
    let browser;
    let client;

    try {
        // Connect to MongoDB
        client = await MongoClient.connect(MONGODB_URI);
        const db = client.db(MONGODB_DB_NAME);
        const collection = db.collection('deals');

        // Get user input
        const id = await getInput('Enter the ID to search: ');
        const url = `https://www.vinted.fr/catalog?search_text=${id}&time=1732213311&page=1`;
        const filename = `scraped_data_${id}.json`;

        // Launch Puppeteer
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        await page.waitForSelector('[data-testid="grid-item"]', { timeout: 10000 });

        const products = await page.evaluate(() => {
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

                // Updated selector for likes
                const likeElement = item.querySelector('[data-testid*="favourite"] span') || item.querySelector('span.web_ui__Text__text');
                const likes = likeElement ? parseInt(likeElement.textContent.trim()) : 0;

                data.push({
                    ownerName,
                    ownerProfileLink,
                    productImage,
                    productLink,
                    price,
                    title,
                    size,
                    likes,
                });
            });

            return data;
        });

        // Save data to a file
        saveDataToFile(products, filename);

        // Replace all existing data with the new scraped data
        await collection.deleteMany({});
        const result = await collection.insertMany(products);
        console.log(`${result.insertedCount} records inserted into MongoDB`);

    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        if (browser) await browser.close();
        if (client) await client.close();
    }
})();
