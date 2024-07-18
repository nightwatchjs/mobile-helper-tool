import {Options, Platform} from '../../interfaces';
import {connectAVD} from './emulator';
import {connectWirelessAdb} from './wireless';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  if (options.wireless) {
    return await connectWirelessAdb(sdkRoot, platform);
  } else if (options.emulator) {
    return await connectAVD(options, sdkRoot, platform);
  }

  return false;
}
