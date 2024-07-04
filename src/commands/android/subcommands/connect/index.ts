import {connectWirelessAdb} from './wireless';
import {Options, Platform} from '../../interfaces';
import {showConnectedDevices} from './list';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  if (options.wireless) {
    return await connectWirelessAdb(sdkRoot, platform);
  } else if (options.list) {
    return await showConnectedDevices();
  }

  return false;
}
