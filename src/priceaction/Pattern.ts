// Enum for candlestick patterns
export enum CandlePattern {
    Hammer = 'Hammer',
    InvertedHammer = 'Inverted Hammer',
    Doji = 'Doji',
    BullishEngulfing = 'Bullish Engulfing',
    BearishEngulfing = 'Bearish Engulfing',
    MorningStar = 'Morning Star',
    EveningStar = 'Evening Star',
    ThreeWhiteSoldiers = 'Three White Soldiers',
    ThreeBlackCrows = 'Three Black Crows',
}

// Interface for candlestick data
interface CandleEntry {
    open: number;
    close: number;
    high: number;
    low: number;
}

// Function to detect single candlestick patterns
export function detectSingleCandlePatterns(entry: CandleEntry): CandlePattern | null {
    let pattern: CandlePattern | null = null;

    const body = Math.abs(entry.close - entry.open);
    const upperShadow = entry.high - Math.max(entry.open, entry.close);
    const lowerShadow = Math.min(entry.open, entry.close) - entry.low;
    const totalRange = entry.high - entry.low;

    // Strict Hammer detection: body must be small, lower shadow must be long
    if (
        body <= totalRange * 0.3 && // Body is less than 30% of the range
        lowerShadow >= body * 2 && // Lower shadow is at least twice the body
        upperShadow < body * 0.18 // Very small or no upper shadow
    ) {
        pattern = CandlePattern.Hammer;
    }

    // Strict Inverted Hammer detection: body must be small, upper shadow must be long
    if (
        body <= totalRange * 0.3 && // Body is less than 30% of the range
        upperShadow >= body * 2 && // Upper shadow is at least twice the body
        lowerShadow < body * 0.18 // Very small or no lower shadow
    ) {
        pattern = CandlePattern.InvertedHammer;
    }

    // Doji
    const smallRange = Math.abs(entry.close - entry.open) / (entry.high - entry.low);
    if (smallRange < 0.1) {
        pattern = CandlePattern.Doji;
    }

    return pattern;
}

// Function to detect two candlestick patterns (Bullish/Bearish Engulfing)
export function detectDoubleCandlePatterns(entry: CandleEntry, prev: CandleEntry): CandlePattern | null {
    let pattern: CandlePattern | null = null;

    // Bullish Engulfing
    if (
        prev.close < prev.open && // Previous day bearish
        entry.open < entry.close && // Current day bullish
        entry.open < prev.close && entry.close > prev.open // Engulfing the previous day's body
    ) {
        pattern = CandlePattern.BullishEngulfing;
    }

    // Bearish Engulfing
    if (
        prev.close > prev.open && // Previous day bullish
        entry.open > entry.close && // Current day bearish
        entry.open > prev.close && entry.close < prev.open // Engulfing the previous day's body
    ) {
        pattern = CandlePattern.BearishEngulfing;
    }

    return pattern;
}

// Function to detect three candlestick patterns (Morning Star, Evening Star, etc.)
export function detectTripleCandlePatterns(
    entry: CandleEntry,
    prev1: CandleEntry,
    prev2: CandleEntry
): CandlePattern | null {
    let pattern: CandlePattern | null = null;

    // Morning Star (Bullish Reversal)
    if (
        prev2.close > prev2.open && // First candle bullish
        prev1.close < prev1.open && // Second candle bearish
        entry.open < entry.close && entry.close > prev1.open // Third candle bullish
    ) {
        pattern = CandlePattern.MorningStar;
    }

    // Evening Star (Bearish Reversal)
    if (
        prev2.close < prev2.open && // First candle bearish
        prev1.close > prev1.open && // Second candle bullish
        entry.open > entry.close && entry.close < prev1.open // Third candle bearish
    ) {
        pattern = CandlePattern.EveningStar;
    }

    // Three White Soldiers (Bullish)
    if (
        prev2.open < prev2.close && // First bullish
        prev1.open < prev1.close && // Second bullish
        entry.open < entry.close && // Third bullish
        prev1.open > prev2.close && entry.open > prev1.close // Successive bullish moves
    ) {
        pattern = CandlePattern.ThreeWhiteSoldiers;
    }

    // Three Black Crows (Bearish)
    if (
        prev2.open > prev2.close && // First bearish
        prev1.open > prev1.close && // Second bearish
        entry.open > entry.close && // Third bearish
        prev1.open < prev2.close && entry.open < prev1.close // Successive bearish moves
    ) {
        pattern = CandlePattern.ThreeBlackCrows;
    }

    return pattern;
}
