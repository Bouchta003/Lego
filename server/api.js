// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = 8092;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Connect to MongoDB with explicit database name ('Lego')
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://bouchtaben003:xgwfWbIurQzptItf@cluster0.7dth8.mongodb.net/Lego?retryWrites=true&writeConcern=majority';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Define Vinted Schema and Model
const vintedSchema = new mongoose.Schema({
  title: String,
  ownerName: String,
  ownerProfileLink: String,
  productImage: String,
  productLink: String,
  price: String,
  size: String,
  likes: Number,
});

// Explicitly link to the 'Vinted' collection in the 'Lego' database
const Vinted = mongoose.model('Vinted', vintedSchema, 'Vinted');

// Routes

// Test Route
app.get('/', (req, res) => {
  res.send({ ack: true });
});

// Get a specific product by ID
app.get('/vinted/:id', async (req, res) => {
  try {
    const product = await Vinted.findById(req.params.id);
    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});
app.get('/vinted-lego-id/:legoID', async (req, res) => {
  try {
    const { legoID } = req.params; // Retrieve legoID from the URL parameter
    const products = await Vinted.find({ legoID }); // Search for products with the given legoID
    
    if (products.length > 0) {
      res.status(200).json(products);
    } else {
      res.status(404).json({ error: 'No products found with this LegoID' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});
// Search products with filters
app.get('/vinted/search', async (req, res) => {
  const { title, ownerName, maxPrice, likes, limit = 10 } = req.query;
  const filter = {};

  // Build filters dynamically based on query parameters
  if (title) filter.title = new RegExp(title, 'i'); // Case-insensitive search
  if (ownerName) filter.ownerName = new RegExp(ownerName, 'i');
  if (maxPrice) filter.price = { $lte: parseFloat(maxPrice) }; // Assuming price is a number
  if (likes) filter.likes = { $gte: parseInt(likes) };

  try {
    const products = await Vinted.find(filter).limit(Number(limit));
    res.status(200).json({ total: products.length, results: products });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

app.get('/deals', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const deals = await Vinted.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Start the server
app.listen(PORT, () => console.log(`📡 API running on http://localhost:${PORT}`));
