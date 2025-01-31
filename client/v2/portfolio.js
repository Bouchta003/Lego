// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectSort = document.querySelector('#sort-select');
const textFilters = document.querySelectorAll('#filters span');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals= document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const salesCountElement = document.querySelector('#nbSales');
const p5Element = document.getElementById('p5SalesPrice');
const p25Element = document.getElementById('p25SalesPrice');
const p50Element = document.getElementById('p50SalesPrice');

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentDeals, currentPagination};
    }
    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}" target="_blank">${deal.title}</a> <!-- Added target="_blank" -->
        <span>${deal.price}</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(selectPage.value, parseInt(event.target.value));
  console.log("number change");
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const deals = await fetchDeals(parseInt(event.target.value), selectShow.value);
  console.log("page change");
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});
//parseInt(event.target.value)
function sortdealspriceASC(deals) {
  return deals.sort((a, b) => a.price - b.price);
}
function sortdealspriceDESC(deals) {
  return deals.sort((a, b) => b.price - a.price);
}
function sortdateASC(deals) {
  return deals.sort((a, b) => new Date(a.published) - new Date(b.published));
}
function sortdateDESC(deals) {
  return deals.sort((b, a) => new Date(a.published) - new Date(b.published));
}
function findDealByIdCommunity(selectedId, selectedCommunity) {
  const result = currentDeals.find(deal => deal.id === selectedId && deal.community === selectedCommunity);
  if (!result) {
    console.log("No deal found for ID:", selectedId);
  }
}
const calculatePercentile = (prices, percentile) => {
  if (prices.length === 0) return 0;
  const index = Math.floor(percentile * prices.length);
  return prices[index];
};
const fetchSalesData = async (legoSetId) => {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${legoSetId}`);
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error('Error fetching sales data');
    }

    return data.data.result || [];
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return []; 
  }
};
const calculateLifetimeInDays = (oldestTimestamp, newestTimestamp) => {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const timeDifferenceInMs = newestTimestamp - oldestTimestamp;
  return Math.floor(timeDifferenceInMs / millisecondsPerDay);
};
const updateLifetimeValue = (salesData) => {
  if (salesData.length === 0) {
    document.getElementById('lifeTimeValue').textContent = "N/A";
    return;
  }
  const publishedTimestamps = salesData.map(sale => sale.published);
  const oldestTimestamp = Math.min(...publishedTimestamps);
  const newestTimestamp = Math.max(...publishedTimestamps);
  const lifetimeInDays = calculateLifetimeInDays(oldestTimestamp, newestTimestamp);
  document.getElementById('lifeTimeValue').textContent = lifetimeInDays;
};

selectLegoSetIds.addEventListener('change', async (event) => {
  const selectedId = event.target.value;
  const community = "dealabs";
  const deals = await fetchDeals(selectPage.value, selectShow.value);
  findDealByIdCommunity(selectedId, community);
  deals.result = deals.result.filter(result => result.id == selectedId && result.community == community);
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});
selectLegoSetIds.addEventListener('change', async (event) => {
  const selectedId = event.target.value;
  const salesData = await fetchSalesData(selectedId);
  salesCountElement.textContent = salesData.length;
  const prices = salesData.map(sale => parseFloat(sale.price)).sort((a, b) => a - b);
  p5Element.textContent = calculatePercentile(prices, 0.05).toFixed(2);
  p25Element.textContent = calculatePercentile(prices, 0.25).toFixed(2);
  p50Element.textContent = calculatePercentile(prices, 0.50).toFixed(2);
  updateLifetimeValue(salesData);
});

selectSort.addEventListener('change', async (event) => {
  const deals = await fetchDeals(selectPage.value, selectShow.value);
  setCurrentDeals(deals);
  switch(selectSort.value){
    case("price-asc"):
      console.log("price-asc");
      sortdealspriceASC(deals.result);
      break;
    case("price-desc"):
      console.log("price-desc");
      sortdealspriceDESC(deals.result);
      break;
    case("date-asc"):
      console.log("date-asc");
      sortdateASC(deals.result);
      break;
    case("date-desc"):
      console.log("date-desc");
      sortdateDESC(deals.result);
      break;
    default:
      console.log("default");
  }
  render(currentDeals, currentPagination);
});
textFilters.forEach((span) => {
  span.addEventListener("click", async (event) => {
    const deals = await fetchDeals(selectPage.value, selectShow.value);
      switch(span.textContent.trim()){
        case "By best discount":
          deals.result = deals.result.filter(result => result.discount >= 50);
          setCurrentDeals(deals);
          render(currentDeals, currentPagination);
          break;
        case "By most commented":
          deals.result = deals.result.filter(result => result.comments > 15);
          setCurrentDeals(deals);
          render(currentDeals, currentPagination);
          break;
        case "By hot deals":
          deals.result = deals.result.filter(result => result.temperature > 100);
          setCurrentDeals(deals);
          render(currentDeals, currentPagination);
          break;
        default:
          console.log('other');
      }
  });
});


document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();
  sortdealspriceASC(deals.result);
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});