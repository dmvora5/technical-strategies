import { EMA, SMA } from 'technicalindicators';
import { elliottWaveOscillator } from '../indicators/elliottWaveOscillator';

interface DataPoint {
    close: number;
    open: number;
    high: number;
    low: number;
    date: string;
    ewo?: number;
    color?: string;
}

interface MAEmperorinsiliconotConfig {
    emaLengths?: number[];
    haEnabled?: boolean;
    maType?: 'EMA' | 'SMA';
}

class MAEmperorinsiliconot {
    private emaLengths: number[];
    private haEnabled: boolean;
    private maType: 'EMA' | 'SMA';

    constructor({ emaLengths = [14, 18, 26, 60, 96], haEnabled = true, maType = "EMA" }: MAEmperorinsiliconotConfig) {
        this.emaLengths = emaLengths;
        this.haEnabled = haEnabled;
        this.maType = maType;
    }

    private calculateEMA(data: number[], length: number): number[] { return EMA.calculate({ period: length, values: data }); }
    private calculateSMA(data: number[], length: number): number[] { return SMA.calculate({ period: length, values: data }); }

    private calculateHeikenAshi(data: { open: number[]; high: number[]; low: number[]; close: number[]; }): { open: number[]; high: number[]; low: number[]; close: number[]; } {
        const haData = {
            open: [],
            high: [],
            low: [],
            close: []
        } as any;

        for (let i = 0; i < data.close.length; i++) {
            const haClose = (data.open[i] + data.high[i] + data.low[i] + data.close[i]) / 4;
            const haOpen = i === 0 ? data.open[i] : (haData.open[i - 1] + haData.close[i - 1]) / 2;
            const haHigh = Math.max(data.high[i], haOpen, haClose);
            const haLow = Math.min(data.low[i], haOpen, haClose);

            haData.open.push(haOpen);
            haData.high.push(haHigh);
            haData.low.push(haLow);
            haData.close.push(haClose);
        }

        return haData;
    }

    private getSourceData(srcType: string, ha: { open: number[]; high: number[]; low: number[]; close: number[]; } | null, inputData: { open: number[]; high: number[]; low: number[]; close: number[]; }): number[] {
        switch (srcType) {
            case 'close':
                return ha ? ha.close : inputData.close;
            case 'open':
                return ha ? ha.open : inputData.open;
            case 'high':
                return ha ? ha.high : inputData.high;
            case 'low':
                return ha ? ha.low : inputData.low;
            default:
                return inputData.close;
        }
    }

    private calculateMA(type: 'EMA' | 'SMA', src: number[], length: number): number[] {
        switch (type) {
            case 'EMA':
                return this.calculateEMA(src, length);
            case 'SMA':
                return this.calculateSMA(src, length);
            default:
                return this.calculateEMA(src, length); // Fallback to EMA
        }
    }

    private processMAs(type: 'EMA' | 'SMA', lengths: number[], srcData: number[]): number[][] {
        return lengths.map(len => this.calculateMA(type, srcData, len));
    }

    private padArray(arr: any[], length: number): any[] {
        const padLength = length - arr.length;
        const padding = new Array(padLength).fill(null);
        return [...padding, ...arr];
    }

    public applyStrategy(data: DataPoint[]): { date: string; open: number; high: number; low: number; close: number; signal: string | null; }[] {
        const inputData = {
            close: data.map(d => d.close),
            open: data.map(d => d.open),
            high: data.map(d => d.high),
            low: data.map(d => d.low),
            date: data.map(d => d.date)
        };

        const haData = this.haEnabled ? this.calculateHeikenAshi(inputData) : null;

        const srcData = this.getSourceData('close', haData, inputData);

        const [ma1, ma2, ma3, ma4, ma5] = this.processMAs(this.maType, this.emaLengths, srcData);

        const paddedMa2 = this.padArray(ma2, srcData.length);
        const paddedMa3 = this.padArray(ma3, srcData.length);

        let longCond = new Array(srcData.length).fill(false);
        let shortCond = new Array(srcData.length).fill(false);

        for (let i = 0; i < paddedMa2.length; i++) {
            if (paddedMa2[i] > paddedMa3[i] && (i === 0 || paddedMa2[i - 1] <= paddedMa3[i - 1])) {
                longCond[i] = true;
            }
            if (paddedMa2[i] < paddedMa3[i] && (i === 0 || paddedMa2[i - 1] >= paddedMa3[i - 1])) {
                shortCond[i] = true;
            }
        }

        const ewoData = elliottWaveOscillator(data);

        const enrichedData = ewoData.map((d, index) => {
            const signal = (longCond[index] && d.color === 'green') ? 'Buy' :
                (shortCond[index] && d.color === 'red') ? 'Sell' : null;
            return {
                date: new Date(d.date).toLocaleString(),
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
                signal: signal
            };
        });

        return enrichedData;
    }
}

export { MAEmperorinsiliconot };
