import axios from 'axios';

export async function getStockPrice(ticker: string) {
  const apiKey = process.env.STOCK_API_KEY; 
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    const timeSeriesData = data["Time Series (Daily)"];

    if (timeSeriesData && Object.keys(timeSeriesData).length > 0) {
      const latestDate = Object.keys(timeSeriesData)[0];

      if (latestDate) {
        const latestData = timeSeriesData[latestDate];

        return {
          date: latestDate,
          open: latestData["1. open"],
          high: latestData["2. high"],
          low: latestData["3. low"],
          close: latestData["4. close"],
          volume: latestData["5. volume"],
        };
      } else {
        return null;
      }
    } else {
      return null; 
    }
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}
