const MongoClient = require('mongodb').MongoClient;

const MONGODB_URI = 'mongodb+srv://bouchtaben003:xgwfWbIurQzptItf@cluster0.7dth8.mongodb.net/?retryWrites=true&writeConcern=majority';
const MONGODB_DB_NAME = 'Lego';

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
//Pas très joli fais nous un truc meilleur
async function updateDealsWithNumericPrice() {
    let client;
    try {
        const { client: dbClient, db } = await connectToDatabase();
        client = dbClient;

        const result = await db.collection('Vinted').updateMany(
            {}, 
            [
                {
                    $set: {
                        numericPrice: {
                            $toDouble: {
                                $replaceAll: {
                                    input: {
                                        $replaceAll: {
                                            input: {
                                                $replaceAll: {
                                                    input: "$price",
                                                    find: "€", 
                                                    replacement: ""
                                                }
                                            },
                                            find: " ", 
                                            replacement: ""
                                        }
                                    },
                                    find: ",",  
                                    replacement: "."  
                                }
                            }
                        }
                    }
                }
            ]
        );

        console.log(`Modified ${result.modifiedCount} documents with numericPrice`);
    } catch (error) {
        console.error('Error updating deals with numeric price:', error);
    } finally {
        if (client) {
            client.close();
        }
    }
}

async function findDealsSorted(sortBy, sortOrder) {
    let client;
    try {
        const { client: dbClient, db } = await connectToDatabase();
        client = dbClient;
        const sortField = {
            [sortBy === 'price' ? 'numericPrice' : sortBy]: sortOrder === 'asc' ? 1 : -1
        };

        const deals = await db.collection('Vinted').aggregate([
            {
                $sort: sortField
            }
        ]).toArray();

        console.log(`Deals Sorted By ${sortBy} in ${sortOrder.toUpperCase()} order:`, deals);
    } catch (error) {
        console.error(`Error finding deals sorted by ${sortBy}:`, error);
    } finally {
        if (client) {
            client.close();
        }
    }
}


async function main() {
    try {
        await updateDealsWithNumericPrice();

        // Prompt user for sort choice and order
        const sortChoice = process.argv[2];
        const sortOrder = process.argv[3];

        if (!['likes', 'price'].includes(sortChoice)) {
            console.error("Invalid sort choice! Use 'likes' or 'price'.");
            return;
        }

        if (!['asc', 'desc'].includes(sortOrder)) {
            console.error("Invalid sort order! Use 'asc' for ascending or 'desc' for descending.");
            return;
        }

        await findDealsSorted(sortChoice, sortOrder);
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

main();
