
export interface ExchangeRates {
  [currency: string]: number;
}

/**
 * Fetches real-time exchange rates relative to USD.
 * Uses a public, keyless endpoint suitable for client-side apps.
 */
export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    if (data && data.rates) {
      return data.rates;
    }
    throw new Error('Invalid rate data');
  } catch (error) {
    console.error('Failed to fetch real-time rates:', error);
    // Fallback static rates if offline/API fails
    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      BTC: 0.000015,
      ETH: 0.0004,
      ARS: 850
    };
  }
};

export const convertToUSD = (amount: number, currency: string, rates: ExchangeRates): number => {
  const rate = rates[currency.toUpperCase()];
  if (!rate) return amount; // Fallback to 1:1 if rate unknown
  return amount / rate;
};
