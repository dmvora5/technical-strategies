import { calculateSSLChannel } from '../indicators/sslChannel';
import { calculateCCI } from '../indicators/cci';

interface Candle {
    high: number;
    low: number;
    close: number;
    date: string;
}

interface SSLCciConfig {
    period: number;
    cciLength: number;
    cciLookbackBefore: number;
    cciLookbackAfter: number;
    cciLowerBand: number;
    cciUpperBand: number;
}

class SSLCciStrategy {
    private config: SSLCciConfig;

    constructor(config: SSLCciConfig) {
        this.config = config;
    }

    public apply(data: Candle[]): (Candle & { crossover: string | null; trade: string | null; })[] {
        const crossovers = calculateSSLChannel(data, this.config.period);
        const cci = calculateCCI(data, this.config.cciLength);

        const enrichedData = data.map((candle, index) => {
            let trade: string | null = null;
            if (crossovers[index]) {
                const cciSignalBefore = this.checkCCISignalBefore(cci, index);
                const cciSignalAfter = this.checkCCISignalAfter(cci, index);
                if (cciSignalBefore || cciSignalAfter) {
                    if (crossovers[index] === 'upward') {
                        trade = 'buy';
                    } else if (crossovers[index] === 'downward') {
                        trade = 'sell';
                    }
                }
            }

            return {
                ...candle,
                crossover: crossovers[index] || null,
                trade: trade
            };
        });

        return enrichedData;
    }

    private checkCCISignalBefore(cci: (number | null)[], index: number): boolean {
        if (index < this.config.cciLookbackBefore) return false;
        const lowerCross = cci.slice(index - this.config.cciLookbackBefore, index).some(value => value !== null && value < this.config.cciLowerBand);
        const upperCross = cci.slice(index - this.config.cciLookbackBefore, index).some(value => value !== null && value > this.config.cciUpperBand);
        return lowerCross || upperCross;
    }

    private checkCCISignalAfter(cci: (number | null)[], index: number): boolean {
        if (index + this.config.cciLookbackAfter >= cci.length) return false;
        const lowerCross = cci.slice(index, index + this.config.cciLookbackAfter).some(value => value !== null && value < this.config.cciLowerBand);
        const upperCross = cci.slice(index, index + this.config.cciLookbackAfter).some(value => value !== null && value > this.config.cciUpperBand);
        return lowerCross || upperCross;
    }
}

export default SSLCciStrategy;
