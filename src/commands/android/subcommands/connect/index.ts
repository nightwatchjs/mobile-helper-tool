import {Options, Platform} from '../../interfaces';
import {verifyOptions} from '../common';
import {connectWirelessAdb} from './wireless';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsVerified = verifyOptions('connect', options);
  if (!optionsVerified) {
    return false;
  }

  if (options.wireless) {
    return await connectWirelessAdb(sdkRoot, platform);
  }

  return false;
}
