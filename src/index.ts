import { calculateCCI } from './indicators/cci';
import { elliottWaveOscillator } from './indicators/elliottWaveOscillator';
import { calculateSSLChannel } from './indicators/sslChannel';

import { MAEmperorinsiliconot } from './strategies/MAEmperorinsiliconot';
import SSLCciStrategy from './strategies/SSLCciStrategy';
import { BollingerBandsSignal } from './strategies/BollingerBandsSignal';
import { RsiAndChandaliarExit } from "./strategies/RsiAndChandaliarExit";

import { JobScheduler } from './utils/schedule';
import { COLSE_TYPE, StructuralSD } from './strategies/StructuralSD';
import { CandlePattern, detectDoubleCandlePatterns, detectSingleCandlePatterns, detectTripleCandlePatterns } from './priceaction/Pattern';
import { SourceType, MacdConfig, MACDResult, Macd } from './indicators/macd';
import { MASourceType, MovingAverageType } from './indicators/MovingAverages';
import { RSISourceType, Rsi } from './indicators/rsi';
import { Atr } from './indicators/atr';
import { BBSourceType, BollingerBandsIndicator } from './indicators/bollingerBandsIndicator';
import { PivotBreakOut } from './priceaction/PivotBreakOut';

const StructuralSdIndicator = {
    COLSE_TYPE,
    StructuralSD,
}

const MacdIndicator = {
    SourceType,
    Macd
}

const MovingAveragesIndicator = {
    MovingAverageType,
    MASourceType
}


const RsiIndicator = {
    Rsi,
    RSISourceType
}

const BollingerBand = {
    BollingerBandsIndicator,
    BBSourceType
}


export {
    calculateCCI,
    elliottWaveOscillator,
    calculateSSLChannel,
    detectDoubleCandlePatterns,
    detectSingleCandlePatterns,
    detectTripleCandlePatterns,
    MAEmperorinsiliconot,
    SSLCciStrategy,
    BollingerBandsSignal,
    RsiAndChandaliarExit,
    JobScheduler,
    CandlePattern,
    Atr,
    PivotBreakOut,
    StructuralSdIndicator,
    MacdIndicator,
    MovingAveragesIndicator,
    RsiIndicator,
    BollingerBand
};

export type { MacdConfig, MACDResult }