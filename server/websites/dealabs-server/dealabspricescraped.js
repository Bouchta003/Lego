const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Define the URL for Lego deals
const URL = 'https://www.dealabs.com/search?q=21061';

(async () => {
    try {
        // Fetch the webpage content
        const { data } = await axios.get(URL);

        // Load the HTML into Cheerio
        const $ = cheerio.load(data);

        // Array to hold scraped deals
        const deals = [];

        // Log the number of threads found
        const threads = $('.thread');
        console.log(`Found ${threads.length} threads.`);

        threads.each((index, element) => {
            // Extract the title
            const title = $(element).find('.thread-title').text().trim();

            // Extract the price
            const price = $(element).find('.threadItemCard-price').text().trim();

            // Extract the discount (optional, may not exist for all items)
            const discount = $(element).find('.thread-discount').text().trim() || "0%";

            // Push to the deals array if the price exists
            if (title && price) {
                deals.push({ title, price, discount });
                console.log(`Scraped Deal #${index + 1}:`, { title, price, discount });
            } else {
                console.log(`Skipping thread #${index + 1}: Missing title or price.`);
            }
        });

        // Save the collected deals to a JSON file
        if (deals.length > 0) {
            fs.writeFileSync('dealabls.json', JSON.stringify(deals, null, 2), 'utf-8');
            console.log('Deals have been saved to dealabls.json');
        } else {
            console.log('No deals found to save.');
        }
    } catch (error) {
        console.error('Error scraping Dealabs:', error);
    }
})();
