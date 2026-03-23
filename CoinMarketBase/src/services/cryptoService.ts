import axios from 'axios';

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  circulating_supply: number;
  sparkline_in_7d?: { price: number[] };
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const fetchTopCoins = async (limit = 250): Promise<CoinData[]> => {
  try {
    const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h',
        locale: 'en',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching coins:', error);
    return [];
  }
};

export const getTopGainers = (coins: CoinData[]) => {
  return [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 10);
};

export const getTopLosers = (coins: CoinData[]) => {
  return [...coins].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 10);
};
