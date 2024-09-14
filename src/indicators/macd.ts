import { MACD } from 'technicalindicators';
import { MACDInput } from 'technicalindicators/declarations/moving_averages/MACD';

export enum SourceType {
    CLOSE = 'close',
    OPEN = 'open',
    HIGH = 'high',
    LOW = 'low',
    HL2 = 'hl2', // High-Low average
    HLC3 = 'hlc3', // High-Low-Close average
    OHLC4 = 'ohlc4', // Open-High-Low-Close average
    HLCC4 = 'hlcc4', // High-Low-Close-Close average
}

export interface MacdConfig {
    sourceType?: SourceType;
    fastPeriod?: number;
    slowPeriod?: number;
    signalPeriod?: number;
}

export interface StockData {
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface MACDResult {
    MACD?: number;
    signal?: number;
    histogram?: number;
}

export class Macd {
    sourceType: SourceType;
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;

    constructor(indicatorConfig: MacdConfig = {}) {
        this.sourceType = indicatorConfig.sourceType || SourceType.CLOSE;
        this.fastPeriod = indicatorConfig.fastPeriod || 12;
        this.slowPeriod = indicatorConfig.slowPeriod || 26;
        this.signalPeriod = indicatorConfig.signalPeriod || 9;
    }

    selectSource(stockData: StockData[]): number[] {
        return stockData.map((entry) => {
            switch (this.sourceType) {
                case SourceType.CLOSE:
                    return entry.close;
                case SourceType.OPEN:
                    return entry.open;
                case SourceType.HIGH:
                    return entry.high;
                case SourceType.LOW:
                    return entry.low;
                case SourceType.HL2: // High-Low average
                    return (entry.high + entry.low) / 2;
                case SourceType.HLC3: // High-Low-Close average
                    return (entry.high + entry.low + entry.close) / 3;
                case SourceType.OHLC4: // Open-High-Low-Close average
                    return (entry.open + entry.high + entry.low + entry.close) / 4;
                case SourceType.HLCC4: // High-Low-Close-Close average
                    return (entry.high + entry.low + entry.close + entry.close) / 4;
                default:
                    throw new Error(`Invalid source type selected: ${this.sourceType}`);
            }
        });
    }

    apply(stockData: StockData[]): (StockData & { macd: number | null; signal: number | null; histogram: number | null; crossoverSignal: string | null })[] {
        // Use the selectSource function to choose the correct price type
        const selectedSource = this.selectSource(stockData);

        // Define MACD input object with correct type
        const macdInput: MACDInput = {
            values: selectedSource,
            fastPeriod: this.fastPeriod,
            slowPeriod: this.slowPeriod,
            signalPeriod: this.signalPeriod,
            SimpleMAOscillator: false, // Use EMA (Exponential Moving Average)
            SimpleMASignal: false, // Use EMA for signal line
        };

        // Calculate MACD using the technicalindicators package
        const macdValues: MACDResult[] = MACD.calculate(macdInput);

        // Append MACD values to the stock data (start from where MACD can be calculated)
        return stockData.map((data, index) => {
            const macdIndex = index - (this.slowPeriod - 1);

            let crossoverSignal: string | null = null;
            if (macdIndex > 0 && macdValues[macdIndex] && macdValues[macdIndex - 1]) {
                const prevMacd = macdValues[macdIndex - 1].MACD ?? 0;
                const prevSignal = macdValues[macdIndex - 1].signal ?? 0;
                const currMacd = macdValues[macdIndex].MACD ?? 0;
                const currSignal = macdValues[macdIndex].signal ?? 0;

                // Detect bullish crossover
                if (prevMacd <= prevSignal && currMacd > currSignal) {
                    crossoverSignal = 'bullish';
                }
                // Detect bearish crossover
                else if (prevMacd >= prevSignal && currMacd < currSignal) {
                    crossoverSignal = 'bearish';
                }
            }

            return macdIndex >= 0 && macdValues[macdIndex]
                ? {
                      ...data,
                      macd: macdValues[macdIndex].MACD ?? null,
                      signal: macdValues[macdIndex].signal ?? null,
                      histogram: macdValues[macdIndex].histogram ?? null,
                      crossoverSignal: crossoverSignal, // Adding the crossover signal
                  }
                : {
                      ...data,
                      macd: null,
                      signal: null,
                      histogram: null,
                      crossoverSignal: null,
                  };
        });
    }
}
