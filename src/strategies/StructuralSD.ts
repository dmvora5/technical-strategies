type Candle = {
    date: string;
    high: number;
    low: number;
    close: number;
    pivot?: string | null;
    pivotDate?: string | null | Date;
    range?: number | null;
    type?: string | null;
    valid?: string | null;
    levelHigh?: number | null;
    levelLow?: number | null;
    retest?: string | null;
    retestDate?: string | null;
    invalidDate?: string | null;
    value?: number;
    index?: number
};

type FVG = {
    formedAt: string;
    range: number;
    type: string;
    index: number;
    high: number;
    low: number;
    valid: string;
};

const COLSE_TYPE = {
    HL: "HL",
    CLOSE: "CLOSE"
} as const;

const PIVOT_TYPE = {
    UP: "UP",
    DOWN: "DOWN",
    BOTH: "BOTH"
} as const;

const LEVEL_TYPE = {
    SUPPORT: "SUPPORT",
    RESISTANCE: "RESISTANCE"
} as const;

const VALIDITY = {
    VALID: "VALID",
    INVALID: "INVALID"
} as const;

const RETEST = {
    SUPPORT: "RETEST_SUPPORT",
    RESISTANCE: "RETEST_RESISTANCE"
} as const;

type IndicatorConfig = {
    pivotStrength?: number;
    closeType?: keyof typeof COLSE_TYPE;
    lookBackCandlesForSignal?: number;
};

class StructuralSD {
    data: Candle[] = [];
    pivotStrength: number = 5;
    closeType: keyof typeof COLSE_TYPE = COLSE_TYPE.HL;
    lookBackCandlesForSignal: number = 3;

    constructor({
        data,
        indicatorConfig = {}
    }: { data: Candle[]; indicatorConfig?: IndicatorConfig }) {
        this.data = data || [];
        this.pivotStrength = indicatorConfig.pivotStrength || this.pivotStrength;
        this.closeType = indicatorConfig.closeType || COLSE_TYPE.HL;
        this.lookBackCandlesForSignal =
            indicatorConfig.lookBackCandlesForSignal || this.lookBackCandlesForSignal;
    }

    detectPivotPoints(): void {
        this.data.forEach((current, index) => {
            if (
                index < this.pivotStrength ||
                index >= this.data.length - this.pivotStrength
            ) {
                this.data[index] = { ...current, pivot: null };
                return;
            }

            const previousCandles = this.data.slice(index - this.pivotStrength, index);
            const nextCandles = this.data.slice(index + 1, index + this.pivotStrength);

            const isFractalUp =
                this.closeType === COLSE_TYPE.HL
                    ? current.high >= Math.max(...previousCandles.map(c => c.high)) &&
                    current.high > Math.max(...nextCandles.map(c => c.high))
                    : current.close >= Math.max(...previousCandles.map(c => c.close)) &&
                    current.close > Math.max(...nextCandles.map(c => c.close));

            const isFractalDown =
                this.closeType === COLSE_TYPE.HL
                    ? current.low <= Math.min(...previousCandles.map(c => c.low)) &&
                    current.low < Math.min(...nextCandles.map(c => c.low))
                    : current.close <= Math.min(...previousCandles.map(c => c.close)) &&
                    current.close < Math.min(...nextCandles.map(c => c.close));

            let pivot: string | null = null;

            if (isFractalUp && isFractalDown) {
                pivot = PIVOT_TYPE.BOTH;
            } else if (isFractalUp) {
                pivot = PIVOT_TYPE.UP;
            } else if (isFractalDown) {
                pivot = PIVOT_TYPE.DOWN;
            }

            this.data[index] = { ...current, pivot };
        });
    }

    getPivotData(candle: Candle): Candle {
        switch (this.closeType) {
            case COLSE_TYPE.HL:
                if (candle.pivot === PIVOT_TYPE.UP) {
                    return { ...candle, value: candle.high };
                } else if (candle.pivot === PIVOT_TYPE.DOWN) {
                    return { ...candle, value: candle.low };
                }
                break;
            case COLSE_TYPE.CLOSE:
                return {
                    ...candle,
                    value: candle.close
                };
            default:
                return candle;
        }

        return candle
    }

    detectFVGs(): void {
        let pivots: Candle[] = [];
        let allFvgs: FVG[] = [];

        this.data.forEach((current, index, array) => {
            const currentCandle: Candle = {
                ...current,
                type: null,
                range: null,
                pivotDate: null,
                valid: null,
                levelHigh: null,
                levelLow: null,
                retest: null,
                invalidDate: null
            };

            allFvgs.forEach((fvg, idx) => {
                if (fvg.type === LEVEL_TYPE.SUPPORT && current.close < fvg.low) {
                    this.data[fvg.index].valid = VALIDITY.INVALID;
                    this.data[fvg.index].invalidDate = current.date;
                    allFvgs.splice(idx, 1);
                    return;
                }
                if (fvg.type === LEVEL_TYPE.RESISTANCE && current.close > fvg.high) {
                    this.data[fvg.index].valid = VALIDITY.INVALID;
                    this.data[fvg.index].invalidDate = current.date;
                    allFvgs.splice(idx, 1);
                    return;
                }

                if (fvg.type === LEVEL_TYPE.SUPPORT && current.close > fvg.low && current.low <= fvg.high) {
                    currentCandle.retest = RETEST.SUPPORT;
                    currentCandle.retestDate = fvg.formedAt;
                }

                if (fvg.type === LEVEL_TYPE.RESISTANCE && current.close < fvg.high && current.high >= fvg.low) {
                    currentCandle.retest = RETEST.RESISTANCE;
                    currentCandle.retestDate = fvg.formedAt;
                }
            });

            if (pivots.length > 0) {
                pivots.forEach((currentPivot) => {
                    if (
                        (currentPivot.pivot === PIVOT_TYPE.UP && current.close > currentPivot.value!) ||
                        (currentPivot.pivot === PIVOT_TYPE.DOWN && current.close < currentPivot.value!)
                    ) {
                        const previousCandle = array[index - 1];
                        const range =
                            currentPivot.pivot === PIVOT_TYPE.UP
                                ? current.low - previousCandle.high
                                : previousCandle.low - current.high;

                        const levelHigh =
                            currentPivot.pivot === PIVOT_TYPE.UP
                                ? previousCandle.high > current.low
                                    ? previousCandle.high
                                    : current.low
                                : current.high > previousCandle.low
                                    ? current.high
                                    : previousCandle.low;

                        const levelLow =
                            currentPivot.pivot === PIVOT_TYPE.UP
                                ? current.low < previousCandle.high
                                    ? current.low
                                    : previousCandle.high
                                : previousCandle.low < current.high
                                    ? previousCandle.low
                                    : current.high;

                        const levelType =
                            currentPivot.pivot === PIVOT_TYPE.UP
                                ? LEVEL_TYPE.SUPPORT
                                : LEVEL_TYPE.RESISTANCE;

                        currentCandle.type = levelType;
                        currentCandle.range = range;
                        currentCandle.pivotDate = currentPivot.date;
                        currentCandle.valid = VALIDITY.VALID;
                        currentCandle.levelHigh = levelHigh;
                        currentCandle.levelLow = levelLow;

                        allFvgs.push({
                            formedAt: current.date,
                            range,
                            type: levelType,
                            index,
                            high: levelHigh,
                            low: levelLow,
                            valid: VALIDITY.VALID
                        });

                        pivots = pivots.filter(ele =>
                            currentPivot.pivot === PIVOT_TYPE.UP
                                ? ele.pivot === PIVOT_TYPE.DOWN || ele.value! > currentPivot.value!
                                : ele.pivot === PIVOT_TYPE.UP || ele.value! < currentPivot.value!
                        );
                    }
                });
            }

            if (current.pivot) {
                const newPivot = this.getPivotData(current);
                pivots.push({ ...newPivot, index });
            }

            this.data[index] = currentCandle;
        });
    }

    checkForSignal(): Candle | false {
        const start = Math.max(this.data.length - this.lookBackCandlesForSignal, 0);
        for (let i = this.data.length - 1; i >= start; i--) {
            if (this.data[i].retest && this.data[i].valid === VALIDITY.VALID) {
                return this.data[i];
            }
        }
        return false;
    }

    apply(print = false): Candle | false {
        this.detectPivotPoints();
        this.detectFVGs();
        if (print) {
            console.table(this.data, [
                "date",
                "range",
                "pivot",
                "type",
                "valid",
                "invalidDate",
                "retest",
                "retestDate"
            ]);
        }
        return this.checkForSignal();
    }
}

export { StructuralSD, COLSE_TYPE };
