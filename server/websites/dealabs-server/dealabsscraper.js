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

const URL = 'https://www.dealabs.com/search?q=21061';

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
            /*
            Doesn't work for all elements, need help !!!
            Pistes d'amélioration (ou si trop compliqué continuer sur le truc en euros)
            Essayer de récup la réponse du serveur (donc le fichier HTML de la page directement) pour bien identifier les spans responsables de tout ça.
            C'est peut-être pour ça qu'on n'a pas la valeur en question.
            
            Update, ce que je voyais comme étant le prix était en réalité une image.
            Comment unlock la situation : 
            Pour le prix aller sur le lien du produit -> chercher le span correspondant au prix (<span class="threadItemCard-price text--b thread-price">166,90€</span>)
            -> Récupérer le prix original (sans discount) -> Récupérer ou calculer la réduction exacte.
            -> Stocker cette valeur dans le MongoDB
            -> Récupérer la chaleur <button title="Actuellement évalué à 43.58° par la communauté. Votez pour donner votre avis !" class="cept-vote-temp vote-temp size--all-m space--l-half-1 vote-temp--warm space--mh-1"> 43° <span class="popover-origin space--b-2"><!----></span></button>
            soit en la récupérant du titre du span ou de la text value.
            -> Same pour la température.
            -> Same pour le nombre de commentaires.
            -> Same pour la date de publication.
            */
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