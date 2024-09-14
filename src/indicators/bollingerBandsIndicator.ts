import { BollingerBands } from 'technicalindicators';

// Enum for source types
export enum BBSourceType {
    CLOSE = 'close',
    OPEN = 'open',
    HIGH = 'high',
    LOW = 'low',
}

// Interface for stock data
export interface StockData {
    open: number;
    high: number;
    low: number;
    close: number;
    [key: string]: any;  // Allows for additional properties to be appended
}

// Interface for the Bollinger Bands input configuration
export interface BollingerBandsConfig {
    sourceType?: BBSourceType;
    period?: number;
    stdDev?: number;
}

// Interface for the Bollinger Bands result
export interface BollingerBandResult {
    upper: number;
    middle: number;
    lower: number;
}

// Class for Bollinger Bands Indicator
export class BollingerBandsIndicator {
    sourceType: BBSourceType;
    period: number;
    stdDev: number;

    constructor(indicatorConfig: BollingerBandsConfig = {}) {
        this.sourceType = indicatorConfig.sourceType || BBSourceType.CLOSE;
        this.period = indicatorConfig.period || 20;
        this.stdDev = indicatorConfig.stdDev || 2;
    }

    // Method to select the source type (open, high, low, or close)
    selectSource(stockData: StockData[]): number[] {
        return stockData.map((entry) => {
            switch (this.sourceType) {
                case BBSourceType.CLOSE:
                    return entry.close;
                case BBSourceType.OPEN:
                    return entry.open;
                case BBSourceType.HIGH:
                    return entry.high;
                case BBSourceType.LOW:
                    return entry.low;
                default:
                    throw new Error(`Invalid source type selected: ${this.sourceType}`);
            }
        });
    }

    // Method to calculate and append Bollinger Bands values to stock data
    apply(stockData: StockData[]): (StockData & { middleBand: number | null, upperBand: number | null, lowerBand: number | null, signal: string | null })[] {
        const selectedSource = this.selectSource(stockData);

        // Calculate Bollinger Bands using the technicalindicators package
        const bollingerInput = {
            values: selectedSource,
            period: this.period,
            stdDev: this.stdDev
        };

        const bollingerValues: BollingerBandResult[] = BollingerBands.calculate(bollingerInput);

        // Append Bollinger Bands values and detect signals for high, low, and close with priority for close signals
        return stockData.map((data, index) => {
            const bollingerIndex = index - (this.period - 1);
            let signal: string | null = null;

            if (bollingerIndex >= 0 && bollingerValues[bollingerIndex]) {
                const upperBand = bollingerValues[bollingerIndex].upper;
                const lowerBand = bollingerValues[bollingerIndex].lower;
                const closePrice = data.close;
                const highPrice = data.high;
                const lowPrice = data.low;

                // Priority: Check close price first
                if (closePrice > upperBand) {
                    signal = 'close above upper band';  // Priority: Close price above upper band
                } else if (closePrice < lowerBand) {
                    signal = 'close below lower band';  // Priority: Close price below lower band
                } else if (closePrice === upperBand) {
                    signal = 'close touching upper band';  // Priority: Close touching upper band
                } else if (closePrice === lowerBand) {
                    signal = 'close touching lower band';  // Priority: Close touching lower band
                }

                // If close is inside bands, then check high/low
                if (!signal) {
                    // Check for signals on high price
                    if (highPrice > upperBand) {
                        signal = 'high above upper band';
                    } else if (highPrice === upperBand) {
                        signal = 'high touching upper band';
                    }

                    // Check for signals on low price
                    if (!signal && lowPrice < lowerBand) {
                        signal = 'low below lower band';
                    } else if (!signal && lowPrice === lowerBand) {
                        signal = 'low touching lower band';
                    }
                }

                return {
                    ...data,
                    middleBand: bollingerValues[bollingerIndex].middle,
                    upperBand: upperBand,
                    lowerBand: lowerBand,
                    signal: signal
                };
            } else {
                return {
                    ...data,
                    middleBand: null,
                    upperBand: null,
                    lowerBand: null,
                    signal: null
                };
            }
        });
    }
}
