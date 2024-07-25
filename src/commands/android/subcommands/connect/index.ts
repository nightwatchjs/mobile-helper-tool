import {Options, Platform} from '../../interfaces';
import {showConnectedRealDevices} from '../common';
import {connectWirelessAdb} from './wireless';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  if (options.wireless) {
    await showConnectedRealDevices();

    return await connectWirelessAdb(sdkRoot, platform);
  }

  return false;
}
