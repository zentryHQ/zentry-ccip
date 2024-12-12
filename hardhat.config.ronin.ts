import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import { networks } from "./config";
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
  etherscan: { enabled: false },
  networks: { ...networks },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify.roninchain.com/server/",
  },
};

export default config;
