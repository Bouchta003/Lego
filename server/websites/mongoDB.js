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
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    const id = await getInput('Enter the ID to search: ');
    const url = `https://www.vinted.fr/catalog?search_text=${id}&time=1732213311&page=1`;
    const filename = `scraped_data_${id}.json`;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    try {
        await page.waitForSelector('[data-testid="grid-item"]');
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

        // Save data to a file
        saveDataToFile(products, filename);

        // Insert data into MongoDB
        const result = await collection.insertMany(products);
        console.log(`${result.insertedCount} records inserted into MongoDB`);

    } catch (error) {
        console.error(`Error during scraping or database operation: ${error.message}`);
    } finally {
        await browser.close();
        await client.close();
    }
})();
