import "dotenv/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@tenderly/hardhat-tenderly";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { utils } from "ethers";
import { HardhatUserConfig } from "hardhat/config";

const ALCHEMY_ID = process.env.ALCHEMY_ID;
if (!ALCHEMY_ID) {
  throw new Error("Please Set ALCHEMY_ID in .env");
}
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error("Please Set PRIVATE_KEY in .env");
}

// ================================= CONFIG =========================================

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  tenderly: {
    project: "team-development",
    username: "InstaDApp",
    forkNetwork: "1",
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
        // blockNumber: 11739260,
        blockNumber: 12068005,
      },
      blockGasLimit: 12000000,
    },
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    mainnet: {
      url: `https://eth.alchemyapi.io/v2/${ALCHEMY_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
      timeout: 150000,
      gasPrice: utils.parseUnits("160", "gwei").toNumber(),
    },
    matic: {
      // url: `https://eth.alchemyapi.io/v2/${ALCHEMY_ID}`,
      url: "https://rpc-mainnet.maticvigil.com/",
      accounts: [`0x${PRIVATE_KEY}`],
      timeout: 150000,
      gasPrice: utils.parseUnits("1", "gwei").toNumber(),
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.0",
        settings: {
          optimizer: { enabled: false },
        },
      },
      {
        version: "0.6.8",
        settings: {
          optimizer: { enabled: false },
        },
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: { enabled: false },
        },
      },
    ],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN,
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  mocha: {
    timeout: 200000,
  },
};

export default config;
