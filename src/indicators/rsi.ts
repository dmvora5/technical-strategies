import { RSI } from 'technicalindicators';

// Define an enum for the source type
export enum RSISourceType {
    Close = 'close',
    Open = 'open',
    High = 'high',
    Low = 'low',
    HL2 = 'hl2',    // High-Low average
    HLC3 = 'hlc3',  // High-Low-Close average
    OHLC4 = 'ohlc4', // Open-High-Low-Close average
    HLCC4 = 'hlcc4'  // High-Low-Close-Close average
}

// Define an interface for the configuration options
interface IndicatorConfig {
    sourceType?: RSISourceType;
    period?: number;
}

// Define the structure of the data entries
interface DataEntry {
    open: number;
    high: number;
    low: number;
    close: number;
}

export class Rsi {
    private sourceType: RSISourceType;
    private period: number;

    constructor(indicatorConfig: IndicatorConfig = { sourceType: RSISourceType.Close, period: 14 }) {
        this.sourceType = indicatorConfig.sourceType || RSISourceType.Close;
        this.period = indicatorConfig.period || 14;
    }

    // Select source data based on the sourceType
    private selectSource(data: DataEntry[]): number[] {
        return data.map(entry => {
            switch (this.sourceType) {
                case RSISourceType.Close:
                    return entry.close;
                case RSISourceType.Open:
                    return entry.open;
                case RSISourceType.High:
                    return entry.high;
                case RSISourceType.Low:
                    return entry.low;
                case RSISourceType.HL2: // High-Low average
                    return (entry.high + entry.low) / 2;
                case RSISourceType.HLC3: // High-Low-Close average
                    return (entry.high + entry.low + entry.close) / 3;
                case RSISourceType.OHLC4: // Open-High-Low-Close average
                    return (entry.open + entry.high + entry.low + entry.close) / 4;
                case RSISourceType.HLCC4: // High-Low-Close-Close average
                    return (entry.high + entry.low + entry.close + entry.close) / 4;
                default:
                    throw new Error(`Invalid source type selected: ${this.sourceType}`);
            }
        });
    }

    // Apply the RSI calculation on the data
    public apply(data: DataEntry[]): Array<DataEntry & { rsi: number | null }> {
        const selectedSource = this.selectSource(data);
        const rsiValues = RSI.calculate({ values: selectedSource, period: this.period });

        // Append RSI values to the data
        return data.map((current, index) => ({
            ...current,
            rsi: index >= this.period ? +rsiValues[index - this.period].toFixed(2) : null
        }));
    }
}
