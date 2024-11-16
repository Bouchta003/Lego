const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');  // Import fs module for file writing

// Define the URL for Lego deals
const URL = 'https://www.dealabs.com/search?q=Lego';

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
            // Get the title of the thread
            const title = $(element).find('.thread-title').text().trim();
            console.log(`Title for thread ${index}:`, title); // Log title

            // Search for any price (numeric value followed by €)
            const price = $(element).text().match(/\d+€/) ? $(element).text().match(/\d+€/)[0] : null;

            console.log(`Price for thread ${index}:`, price); // Log price

            // If price is found, store it in the deals array
            if (price) {
                deals.push({ title, price });
            }
        });

        // Save the collected deals to a JSON file
        fs.writeFileSync('deals.json', JSON.stringify(deals, null, 2), 'utf-8');
        console.log('Deals have been saved to deals.json');

    } catch (error) {
        console.error('Error scraping Dealabs:', error);
    }
})();
