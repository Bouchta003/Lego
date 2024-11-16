const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

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

            // Try matching any price values in the thread using regex
            const price = $(element).text().match(/\d+€/) ? $(element).text().match(/\d+€/)[0] : null;
            const link = $(element).find('.thread-title a').attr('href');
            console.log(`Link for thread ${index}:`, link); // Log link
            // If a price is found, log it and store it in the deals array
            if (price) {
                console.log(`Price for thread ${index}:`, price); // Log price
                deals.push({ title, price,link  });
            } else {
                console.log(`No price found for thread ${index}`);
            }
        });

        // Save the collected deals to a JSON file
        fs.writeFileSync('deals.json', JSON.stringify(deals, null, 2), 'utf-8');
        console.log('Deals have been saved to deals.json');

    } catch (error) {
        console.error('Error scraping Dealabs:', error);
    }
})();
