import { calculateCCI } from './indicators/cci';
import { elliottWaveOscillator } from './indicators/elliottWaveOscillator';
import { calculateSSLChannel } from './indicators/sslChannel';

import { MAEmperorinsiliconot } from './strategies/MAEmperorinsiliconot';
import SSLCciStrategy from './strategies/SSLCciStrategy';
import { BollingerBandsSignal } from './strategies/BollingerBandsSignal';
import { RsiAndChandaliarExit} from "./strategies/RsiAndChandaliarExit";

import { JobScheduler } from './utils/schedule';
import { COLSE_TYPE, StructuralSD } from './strategies/StructuralSD';

const StructuralSdUtils = {
    COLSE_TYPE: {
        ...COLSE_TYPE
    }
}

export {
    calculateCCI,
    elliottWaveOscillator,
    calculateSSLChannel,
    MAEmperorinsiliconot,
    SSLCciStrategy,
    BollingerBandsSignal,
    RsiAndChandaliarExit,
    JobScheduler,
    StructuralSD,
    StructuralSdUtils
};
