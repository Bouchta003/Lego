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
            // Get the title of the thread
            const title = $(element).find('.thread-title').text().trim();
            console.log(`Title for thread ${index}:`, title); // Log title

            // Extract the price, original price, and discount percentage
            const priceElement = $(element).find('.threadItemCard-price');
            const price = priceElement.text().trim();

            // Extract the original price if available
            const originalPriceElement = $(element).find('.text--lineThrough');
            const originalPrice = originalPriceElement.text().trim();

            // Extract the discount percentage if available
            const discountElement = $(element).find('.color--text-TranslucentPrimary');
            const discount = discountElement.text().trim() || "0"; // Default to 0 if no discount found

            // Get the link to the deal
            const link = $(element).find('.thread-title a').attr('href');
            console.log(`Link for thread ${index}:`, link); // Log link

            // If a price is found, log the deal and add it to the array
            if (price) {
                console.log(`Price for thread ${index}:`, price); // Log price
                console.log(`Original Price for thread ${index}:`, originalPrice); // Log original price
                console.log(`Discount for thread ${index}:`, discount); // Log discount

                // Push the deal to the deals array
                deals.push({
                    title,
                    price,
                    originalPrice,
                    discount,
                    link
                });
            } else {
                console.log(`No price found for thread ${index}`);
            }
        });

        // Check the data in the array before writing to JSON
        console.log('Scraped Deals:', deals);

        // Save the collected deals to a JSON file named 'dealabls.json'
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
