import { SMA, EMA } from 'technicalindicators';

// Enum for moving average types
export enum MovingAverageType {
    SMA = 'SMA',
    EMA = 'EMA'
}

// Enum for source types
export enum MASourceType {
    CLOSE = 'close',
    OPEN = 'open',
    HIGH = 'high',
    LOW = 'low',
}

export interface IndicatorConfig {
    sourceType?: MASourceType;
}

export interface MovingAverageConfig {
    type: MovingAverageType;
    period: number;
}

export interface StockData {
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface MovingAveragesResult {
    [key: string]: number | null;
}

export interface SignalResult {
    movingAverages: MovingAveragesResult;
    signal: string | null;
}

export class MovingAverages {
    sourceType: MASourceType;
    movingAverages: MovingAverageConfig[];
    crossover: boolean;

    constructor({ movingAverages = [], crossover = false, indicatorConfig = {} }: { movingAverages: MovingAverageConfig[], crossover?: boolean, indicatorConfig?: IndicatorConfig }) {
        this.sourceType = indicatorConfig.sourceType || MASourceType.CLOSE;
        this.movingAverages = movingAverages;
        this.crossover = crossover || (movingAverages.length > 1 ? true : false);
    }

    // Function to select source based on the provided stock data and source type
    selectSource(stockData: StockData[]): number[] {
        return stockData.map((entry) => {
            switch (this.sourceType) {
                case MASourceType.CLOSE:
                    return entry.close;
                case MASourceType.OPEN:
                    return entry.open;
                case MASourceType.HIGH:
                    return entry.high;
                case MASourceType.LOW:
                    return entry.low;
                default:
                    throw new Error(`Invalid source type selected: ${this.sourceType}`);
            }
        });
    }

    apply(stockData: StockData[]): (StockData & SignalResult)[] {
        const selectedSource = this.selectSource(stockData);

        // Calculate each moving average
        const maValues = this.movingAverages.map((ma) => {
            if (ma.type === MovingAverageType.SMA) {
                return SMA.calculate({ values: selectedSource, period: ma.period });
            } else if (ma.type === MovingAverageType.EMA) {
                return EMA.calculate({ values: selectedSource, period: ma.period });
            } else {
                throw new Error(`Invalid moving average type selected: ${ma.type}`);
            }
        });

        // Append the selected moving average values and detect crossovers if enabled
        return stockData.map((data, index) => {
            let signal: string | null = null;
            const maResults: MovingAveragesResult = {};

            // Collect each moving average for the current index
            this.movingAverages.forEach((ma, maIndex) => {
                const maValue = maValues[maIndex][index - (ma.period - 1)];
                maResults[`${ma.type}${ma.period}`] = maValue || null;

                const closePrice = data.close;
                const highPrice = data.high;
                const lowPrice = data.low;

                if (this.movingAverages.length === 1 && maValue !== undefined) {
                    if (index > 0) {
                        const previousClose = stockData[index - 1].close;
                        if (previousClose < maValue && closePrice > maValue) {
                            signal = 'crossing up';  // Crossed above the moving average
                        } else if (previousClose > maValue && closePrice < maValue) {
                            signal = 'crossing down';  // Crossed below the moving average
                        } else if (maValue < highPrice && maValue > lowPrice) {
                            signal = 'touching';  // Touching the moving average
                        }
                    }
                }
            });

            // Detect crossover if enabled and more than one moving average is selected
            if (this.crossover && this.movingAverages.length > 1) {
                for (let i = 1; i < this.movingAverages.length; i++) {
                    const shortMAKey = `${this.movingAverages[i - 1].type}${this.movingAverages[i - 1].period}`;
                    const longMAKey = `${this.movingAverages[i].type}${this.movingAverages[i].period}`;
                    const shortMA = maResults[shortMAKey];
                    const longMA = maResults[longMAKey];

                    if (shortMA !== null && longMA !== null) {
                        if (index > 0) {
                            const prevShortMA = maValues[i - 1][index - (this.movingAverages[i - 1].period - 1) - 1];
                            const prevLongMA = maValues[i][index - (this.movingAverages[i].period - 1) - 1];

                            if (prevShortMA !== undefined && prevLongMA !== undefined) {
                                if (prevShortMA < prevLongMA && shortMA > longMA) {
                                    signal = 'crossover up';
                                } else if (prevShortMA > prevLongMA && shortMA < longMA) {
                                    signal = 'crossover down';
                                }
                            }
                        }
                    }
                }
            }

            return {
                ...data,
                movingAverages: maResults,
                signal: signal // Add signal for touching or crossover
            };
        });
    }
}



