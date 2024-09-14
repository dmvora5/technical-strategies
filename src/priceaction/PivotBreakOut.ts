import { detectSingleCandlePatterns } from "./Pattern";

export interface StockData {
    open: number;
    high: number;
    low: number;
    close: number;
    pivot?: number; // 1 for Pivot High, 2 for Pivot Low, undefined otherwise
    pointpos?: number | null;
    breakout?: string | null;
    pattern?: string | null;
}

export interface PivotBreakOutConfig {
    window?: number;
}

export class PivotBreakOut {
    window: number;

    constructor(config: PivotBreakOutConfig = {}) {
        this.window = config.window || 3;
    }

    detectPivots(data: StockData[]): StockData[] {
        data.forEach((current, i) => {
            if (i < this.window || i >= data.length - this.window) return;

            let isSwingHigh = true;
            let isSwingLow = true;

            for (let j = 1; j <= this.window; j++) {
                if (data[i - j].high >= current.high || data[i + j].high >= current.high) {
                    isSwingHigh = false;
                }
                if (data[i - j].low <= current.low || data[i + j].low <= current.low) {
                    isSwingLow = false;
                }
            }

            if (isSwingHigh) {
                current.pivot = 1; // Pivot High
            } else if (isSwingLow) {
                current.pivot = 2; // Pivot Low
            }
        });

        return data;
    }

    calculatePointPos(data: StockData[]): StockData[] {
        data.forEach((current) => {
            if (current.pivot === 1) {
                current.pointpos = current.high + 0.001; // Point position above the high
            } else if (current.pivot === 2) {
                current.pointpos = current.low - 0.001; // Point position below the low
            } else {
                current.pointpos = null; // No pivot, no point position
            }
        });

        return data;
    }

    detectBreakouts(data: StockData[]): StockData[] {
        let lastResistance: number | null = null;
        let lastSupport: number | null = null;
        let breakoutOccurred = false; // Flag to indicate a breakout has occurred

        data.forEach((current, index) => {
            if (current.pivot === 1) {
                lastResistance = current.high;
                breakoutOccurred = false; // Reset after new swing high
            } else if (current.pivot === 2) {
                lastSupport = current.low; // Update support
                breakoutOccurred = false; // Reset after new swing low
            }

            if (!breakoutOccurred && lastResistance !== null) {
                if (current.high > lastResistance) {
                    current.breakout = 'Breakout High';
                    breakoutOccurred = true; // Mark that a breakout has occurred
                }
            }

            if (!breakoutOccurred && lastSupport !== null) {
                if (current.low < lastSupport) {
                    current.breakout = 'Breakout Low';
                    breakoutOccurred = true; // Mark that a breakout has occurred
                }
            }

            current.pattern = detectSingleCandlePatterns(current);
        });

        return data;
    }

    apply(data: StockData[]): StockData[] {
        let stockData = this.detectPivots(data); // Adjust window size for better swing detection
        stockData = this.calculatePointPos(stockData);
        stockData = this.detectBreakouts(stockData);

        return stockData;
    }
}
