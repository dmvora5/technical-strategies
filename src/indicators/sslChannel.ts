import { SMA } from 'technicalindicators';

interface Candle {
    high: number;
    low: number;
    close: number;
}

function calculateSSLChannel(data: Candle[], period: number): (string | null)[] {
    const highPrices = data.map(candle => candle.high);
    const lowPrices = data.map(candle => candle.low);
    const closePrices = data.map(candle => candle.close);

    const smaHigh = SMA.calculate({ period, values: highPrices });
    const smaLow = SMA.calculate({ period, values: lowPrices });

    let Hlv = new Array(data.length).fill(null);
    let sslDown = new Array(data.length).fill(null);
    let sslUp = new Array(data.length).fill(null);

    for (let i = period - 1; i < data.length; i++) {
        if (closePrices[i] > smaHigh[i - period + 1]) {
            Hlv[i] = 1;
        } else if (closePrices[i] < smaLow[i - period + 1]) {
            Hlv[i] = -1;
        } else {
            Hlv[i] = Hlv[i - 1];
        }

        sslDown[i] = Hlv[i] < 0 ? smaHigh[i - period + 1] : smaLow[i - period + 1];
        sslUp[i] = Hlv[i] < 0 ? smaLow[i - period + 1] : smaHigh[i - period + 1];
    }

    const crossovers = new Array(data.length).fill(null);
    for (let i = period; i < data.length; i++) {
        if (sslUp[i - 1] < sslDown[i - 1] && sslUp[i] > sslDown[i]) {
            crossovers[i] = 'upward'; // Upward crossover
        } else if (sslUp[i - 1] > sslDown[i - 1] && sslUp[i] < sslDown[i]) {
            crossovers[i] = 'downward'; // Downward crossover
        }
    }

    return crossovers;
}

export { calculateSSLChannel };
