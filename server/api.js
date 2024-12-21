const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const app = express();
const PORT = 8092;

app.use(express.json());

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));


module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.get('/', (request, response) => {
  response.send({'ack': true});
});

app.listen(PORT);

console.log(`📡 Running on port ${PORT}`);

app.get('/deals/:id', async (req, res) => {
  const dealId = req.params.id;
  const deal = await fetchDealById(dealId); // Replace with DB call
  if (deal) {
    res.status(200).json(deal);
  } else {
    res.status(404).json({ error: 'Deal not found' });
  }
});
app.get('/deals/search', async (req, res) => {
  const { limit = 12, price, date, filterBy } = req.query;
  const filters = { limit, price, date, filterBy };
  const deals = await searchDeals(filters); // Replace with DB call
  res.status(200).json(deals);
});
app.get('/sales/search', async (req, res) => {
  const { limit = 12, legoSetId } = req.query;
  const filters = { limit, legoSetId };
  const sales = await searchSales(filters); // Replace with DB call
  res.status(200).json(sales);
});
