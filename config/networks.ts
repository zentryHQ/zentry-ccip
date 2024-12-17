import { Chains, EtherscanConfig, Networks } from "./types";
import configData from "./config.json";

require("@chainlink/env-enc").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const accounts = [];
if (PRIVATE_KEY) {
  accounts.push(PRIVATE_KEY);
}

const networks: Networks = {
  hardhat: {
    confirmations: 1,
  },
  [Chains.mainnet]: {
    ...configData.mainnet,
    url: process.env.MAINNET_RPC_URL || "UNSET",
    gasPrice: undefined,
    nonce: undefined,
    accounts,
  },
  [Chains.sepolia]: {
    ...configData.ethereumSepolia,
    url: process.env.SEPOLIA_RPC_URL || "UNSET",
    gasPrice: undefined,
    nonce: undefined,
    accounts,
  },
  [Chains.roninSaigon]: {
    ...configData.roninSaigon,
    url: process.env.RONIN_SAIGON_RPC_URL || "UNSET",
    gasPrice: undefined,
    nonce: undefined,
    accounts,
  },
};

const etherscan: EtherscanConfig = {
  apiKey: {
    [Chains.sepolia]: process.env.ETHERSCAN_API_KEY || "UNSET",
  },
  customChains: [
    {
      network: Chains.roninSaigon,
      chainId: configData.roninSaigon.chainId,
      urls: {
        apiURL: "https://saigon-app.roninchain.com",
        browserURL: "https://saigon-app.roninchain.com",
      },
    },
  ],
};

export { networks, etherscan };
