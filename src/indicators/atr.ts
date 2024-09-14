import { ATR } from 'technicalindicators';  // Import ATR from technicalindicators

// Interface for stock data
export interface StockData {
    high: number;
    low: number;
    close: number;
    [key: string]: any;  // This allows for additional properties in each data point
}

// Interface for indicator configuration
export interface AtrConfig {
    period?: number;
}

// Class for ATR Indicator
export class Atr {
    period: number;

    constructor(indicatorConfig: AtrConfig = {}) {
        this.period = indicatorConfig.period || 14;
    }

    apply(stockData: StockData[]): (StockData & { atr: number | null })[] {
        const highValues = stockData.map(data => data.high);
        const lowValues = stockData.map(data => data.low);
        const closeValues = stockData.map(data => data.close);
    
        // Calculate ATR using the technicalindicators package
        const atrValues: number[] = ATR.calculate({
            high: highValues,
            low: lowValues,
            close: closeValues,
            period: this.period
        });
    
        // Append ATR values to the stock data
        return stockData.map((data, index) => {
            const atrIndex = index - this.period;
            const atr = atrIndex >= 0 ? atrValues[atrIndex] : null;  // ATR starts calculating after the first `period` candles
    
            return {
                ...data,
                atr: atr  // Add ATR value to each data point
            };
        });
    }
}
