import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { etherscan, networks, sourcify } from "./config";
import "./tasks";

const SOLC_SETTINGS = {
  optimizer: {
    enabled: true,
    runs: 1_000,
  },
};

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: SOLC_SETTINGS,
      },
    ],
  },
  etherscan: { ...etherscan },
  sourcify: { ...sourcify },
  networks: { ...networks },
};

export default config;
