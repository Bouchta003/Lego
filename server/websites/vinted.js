const MongoClient = require('mongodb').MongoClient;

// MDp à modifier pour plus de confidentialité
const MONGODB_URI = 'mongodb+srv://bouchtaben003:xgwfWbIurQzptItf@cluster0.7dth8.mongodb.net/?retryWrites=true&writeConcern=majority';
const MONGODB_DB_NAME = 'Lego';

async function connectToDatabase() {
    let client;
    try {
        // Removed deprecated options
        client = await MongoClient.connect(MONGODB_URI);
        const db = client.db(MONGODB_DB_NAME);
        return { client, db };
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

async function updateDealsWithNumericPrice() {
    let client;
    try {
        const { client: dbClient, db } = await connectToDatabase();
        client = dbClient;
        
        const result = await db.collection('deals').updateMany(
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

async function findDealsSortedByPrice() {
    let client;
    try {
        const { client: dbClient, db } = await connectToDatabase();
        client = dbClient;
        const deals = await db.collection('deals').aggregate([
            {
                $sort: { numericPrice: 1 } 
            }
        ]).toArray();

        console.log('Deals Sorted By Numeric Price:', deals);
    } catch (error) {
        console.error('Error finding deals sorted by price:', error);
    } finally {
        if (client) {
            client.close();
        }
    }
}

async function main() {
    try {
        await updateDealsWithNumericPrice();
        await findDealsSortedByPrice();
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

main();
