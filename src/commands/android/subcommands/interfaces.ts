// configs for subcommand options
export interface CliConfig {
  name: string,
  alias: string[],
  description: string,
  usageHelp: string,
}

export interface Subcommand {
  description: string;
  cliConfigs?: CliConfig[];
  flags: {
    name: string;
    description: string;
    cliConfigs?: CliConfig[];
  }[];
}

export interface AvailableSubcommands {
  [key: string]: Subcommand;
}

export interface SubcommandOptionsVerificationResult {
  subcommandFlag: string;
  configs: string[];
}
