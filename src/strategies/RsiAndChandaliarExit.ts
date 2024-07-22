import { RSI, SMA, ATR } from 'technicalindicators';

interface Config {
    rsiLength?: number;
    maLength?: number;
    maType?: 'SMA';
    atrPeriod?: number;
    atrMultiplier?: number;
    useClosePriceForExtremums?: boolean;
    checkCandles?: number;
}

interface DataItem {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    crossover?: 'up' | 'down' | null;
    trade?: 'buy' | 'sell' | null;
    signal?: 'buy' | 'sell' | null;
}

class RsiAndChandaliarExit {
    private config: Config;

    constructor(config: Config = {}) {
        const defaultConfig: Config = {
            rsiLength: 25,
            maLength: 150,
            maType: 'SMA',
            atrPeriod: 1,
            atrMultiplier: 2,
            useClosePriceForExtremums: true,
            checkCandles: 2,
        };

        this.config = { ...defaultConfig, ...config };
    }

    // Utility function to calculate moving average
    private calculateMA(source: number[], length: number, type: 'SMA'): number[] {
        return SMA.calculate({ period: length, values: source });
    }

    // Function to calculate RSI
    private calculateRSI(source: number[], length: number): number[] {
        return RSI.calculate({ period: length, values: source });
    }

    // Function to extract OHLC4 prices from the data
    private extractOHLC4Prices(data: DataItem[]): number[] {
        return data.map(item => (item.open + item.high + item.low + item.close) / 4);
    }

    // Function to detect crossovers and add crossover key
    private detectCrossover(data: DataItem[], rsiValues: number[], maValues: number[]): DataItem[] {
        const minLength = Math.min(data.length, rsiValues.length, maValues.length);
        const alignedData = data.slice(-minLength);
        const alignedRsi = rsiValues.slice(-minLength);
        const alignedMa = maValues.slice(-minLength);

        for (let i = 1; i < alignedData.length; i++) {
            if (alignedRsi[i] > alignedMa[i] && alignedRsi[i - 1] <= alignedMa[i - 1]) {
                alignedData[i].crossover = 'up';
            } else if (alignedRsi[i] < alignedMa[i] && alignedRsi[i - 1] >= alignedMa[i - 1]) {
                alignedData[i].crossover = 'down';
            } else {
                alignedData[i].crossover = null;
            }
            alignedData[i].signal = null;
        }

        return alignedData;
    }

    // Function to calculate Chandelier Exit
    private chandelierExit(inputData: DataItem[]): DataItem[] {
        const { atrPeriod, atrMultiplier, useClosePriceForExtremums } = this.config;
        const closePrices = inputData.map(d => d.close);
        const atrValues = ATR.calculate({ period: atrPeriod!, high: inputData.map(d => d.high), low: inputData.map(d => d.low), close: closePrices });

        if (atrValues.length < atrPeriod!) {
            throw new Error('Not enough data to calculate ATR');
        }

        const atr = atrValues.map(value => value * atrMultiplier!);
        let longStop: (number | null)[] = [], shortStop: (number | null)[] = [], dir = 1;

        for (let i = 0; i < inputData.length; i++) {
            if (i < atrPeriod!) {
                longStop.push(null);
                shortStop.push(null);
                inputData[i].trade = null;
                continue;
            }

            const atrValue = atr[i - atrPeriod!];
            const dataSlice = inputData.slice(i - atrPeriod!, i + 1);
            const highPrice = useClosePriceForExtremums ? Math.max(...dataSlice.map(d => d.close)) : Math.max(...dataSlice.map(d => d.high));
            const lowPrice = useClosePriceForExtremums ? Math.min(...dataSlice.map(d => d.close)) : Math.min(...dataSlice.map(d => d.low));

            let longStopValue = highPrice - atrValue;
            let shortStopValue = lowPrice + atrValue;

            if (i >= atrPeriod!) {
                longStopValue = inputData[i - 1].close > longStop[i - 1]! ? Math.max(longStopValue, longStop[i - 1]!) : longStopValue;
                shortStopValue = inputData[i - 1].close < shortStop[i - 1]! ? Math.min(shortStopValue, shortStop[i - 1]!) : shortStopValue;
            }

            longStop.push(longStopValue);
            shortStop.push(shortStopValue);

            let previousDir = dir;
            dir = inputData[i].close > shortStopValue ? 1 : inputData[i].close < longStopValue ? -1 : dir;

            inputData[i].trade = (dir !== previousDir) ? (dir === 1 ? 'buy' : 'sell') : null;
        }

        return inputData;
    }

    // Main computation function
    public computeIndicators(data: DataItem[]): DataItem[] {
        const { rsiLength, maLength, maType, checkCandles } = this.config;
        const ohlc4Prices = this.extractOHLC4Prices(data);

        // Calculate RSI and RSI-based Moving Average
        const rsi = this.calculateRSI(ohlc4Prices, rsiLength!);
        const rsiMA = this.calculateMA(rsi, maLength!, maType!);

        // Detect crossover and calculate Chandelier Exit
        const updatedData = this.detectCrossover(data, rsi, rsiMA);
        const chandelierData = this.chandelierExit(updatedData);

        // Add combined signals
        for (let i = 0; i < chandelierData.length; i++) {
            const current = chandelierData[i];

            // Check for crossover signals within 2 candles before or after the current index
            for (let j = 1; j <= checkCandles!; j++) {
                if (i - j >= 0 && chandelierData[i - j].crossover) {
                    if (chandelierData[i - j].crossover === 'down' && current.trade === 'sell') {
                        chandelierData[i].signal = 'sell';
                        break;
                    } else if (chandelierData[i - j].crossover === 'up' && current.trade === 'buy') {
                        chandelierData[i].signal = 'buy';
                        break;
                    }
                }
                if (i + j < chandelierData.length && chandelierData[i + j].crossover) {
                    if (chandelierData[i + j].crossover === 'down' && current.trade === 'sell') {
                        chandelierData[i + j].signal = 'sell';
                        break;
                    } else if (chandelierData[i + j].crossover === 'up' && current.trade === 'buy') {
                        chandelierData[i + j].signal = 'buy';
                        break;
                    }
                }
            }
        }

        return chandelierData;
    }
}

export { RsiAndChandaliarExit };