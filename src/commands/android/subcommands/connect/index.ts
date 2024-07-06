import {connectWirelessAdb} from './wireless';
import {Options, Platform} from '../../interfaces';
import {showConnectedDevices} from '../common';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  if (options.wireless) {
    await showConnectedDevices(options);

    return await connectWirelessAdb(sdkRoot, platform);
  }

  return false;
}
