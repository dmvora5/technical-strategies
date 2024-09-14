# trading-indicators
trading-indicators

const ma = new MovingAverages({
    movingAverages: [
        { type: MovingAverageType.SMA, period: 20 },
        { type: MovingAverageType.EMA, period: 50 }
    ],
    crossover: true,
    indicatorConfig: { sourceType: SourceType.CLOSE }
});