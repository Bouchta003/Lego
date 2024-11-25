const axios = require('axios');
const cheerio = require('cheerio');
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://bouchtaben003:xgwfWbIurQzptItf@cluster0.7dth8.mongodb.net/?retryWrites=true&writeConcern=majority';
const MONGODB_DB_NAME = 'Lego';
const MONGODB_COLLECTION_NAME = 'Dealabs';

async function connectToDatabase() {
    let client;
    try {
        client = await MongoClient.connect(MONGODB_URI);
        const db = client.db(MONGODB_DB_NAME);
        return { client, db };
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}


async function saveDealsToDatabase(deals) {
    const { client, db } = await connectToDatabase();
    const collection = db.collection(MONGODB_COLLECTION_NAME);
    
    try {
        const result = await collection.insertMany(deals);
        console.log(`${result.insertedCount} deals inserted into the database.`);
    } catch (error) {
        console.error('Error saving deals to database:', error);
    } finally {
        await client.close();
    }
}

const URL = 'https://www.dealabs.com/search?q=Lego';

(async () => {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);
        const deals = [];
        const threads = $('.thread');
        console.log(`Found ${threads.length} threads.`);

        threads.each((index, element) => {
            const title = $(element).find('.thread-title').text().trim();
            console.log(`Title for thread ${index}:`, title);
            const price = $(element).text().match(/\d+€/) ? $(element).text().match(/\d+€/)[0] : null;
            const link = $(element).find('.thread-title a').attr('href');
            console.log(`Link for thread ${index}:`, link);

            if (price) {
                console.log(`Price for thread ${index}:`, price);
                deals.push({ title, price, link });
            } else {
                console.log(`No price found for thread ${index}`);
            }
        });

        if (deals.length > 0) {
            await saveDealsToDatabase(deals);
        } else {
            console.log('No deals to save.');
        }

    } catch (error) {
        console.error('Error scraping Dealabs:', error);
    }
})();
