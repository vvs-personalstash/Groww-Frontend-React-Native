const API_KEY = '4153WLI4JQIEABNJ';
const BASE_URL = 'https://www.alphavantage.co/query';

async function testAPI() {
  const url = `${BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`;

  console.log('Testing AlphaVantage API...');
  console.log('URL:', url.replace(/apikey=[^&]+/, 'apikey=***'));
  console.log('');

  try {
    const response = await fetch(url);
    console.log('Response Status:', response.status, response.statusText);

    const data = await response.json();
    console.log('');
    console.log('Response Keys:', Object.keys(data));
    console.log('');

    if (data['Error Message']) {
      console.error('Error Message:', data['Error Message']);
    } else if (data['Note']) {
      console.error('Rate Limit Note:', data['Note']);
      console.error('You have exceeded the free tier limit (25 requests/day)');
    } else if (data['Information']) {
      console.error('Information:', data['Information']);
      console.error('You are making requests too frequently (max 5/minute)');
    } else if (data.top_gainers && data.top_losers) {
      console.log('SUCCESS! API is working correctly');
      console.log('Top Gainers:', data.top_gainers.length);
      console.log('Top Losers:', data.top_losers.length);
      console.log('');
      console.log('Sample Gainer:', data.top_gainers[0]);
    } else {
      console.warn('Unexpected response structure');
      console.log('Full Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testAPI();

