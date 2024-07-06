import {verifyOptions} from '../common';
import {connectWirelessAdb} from './wireless';
import {Options, Platform} from '../../interfaces';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsPassed = Object.keys(options).filter(option => options[option] === true);

  const optionsVerified = verifyOptions('connect', optionsPassed);
  if (!optionsVerified) {
    return false;
  }

  if (options.wireless) {
    return await connectWirelessAdb(sdkRoot, platform);
  }

  return false;
}
