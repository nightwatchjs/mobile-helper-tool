import {Options, Platform} from '../../interfaces';
import {verifyOptions, showConnectedRealDevices} from '../common';
import {connectWirelessAdb} from './wireless';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const verifyResult = verifyOptions('connect', options);
  if (!verifyResult) {
    return false;
  }

  const subcommandFlag = verifyResult.subcommandFlag;
  if (subcommandFlag === '') {
    // flag not passed by the user -- prompt user for the flag
  }

  if (subcommandFlag === 'wireless') {
    await showConnectedRealDevices();

    return await connectWirelessAdb(sdkRoot, platform);
  }

  return false;
}
