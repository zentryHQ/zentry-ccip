import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import { HardhatUserConfig } from "hardhat/config";

import "dotenv/config";
import { etherscan, networks } from "./config";

import "./tasks";

const SOLC_SETTINGS = {
  optimizer: {
    enabled: true,
    runs: 1_000,
  },
};

const config: HardhatUserConfig = {
  // mocha: {
  //   timeout: 100_000,
  // },
  defaultNetwork: "hardhat",
  solidity: {
    settings: {
      evmVersion: "paris",
    },
    compilers: [
      {
        version: "0.8.24",
        settings: SOLC_SETTINGS,
      },
    ],
  },
  etherscan: { ...etherscan },
  networks: { ...networks },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
