import { AbiItem } from "web3-utils";
type ABIS = {
  [key in "connectors" | "read" | "basic"]: { [key: string]: AbiItem[] };
};
export default {
  connectors: {
    basic: require("./abi/connectors/basic.json"),
    auth: require("./abi/connectors/auth.json"),
    compound: require("./abi/connectors/compound.json"),
    maker: require("./abi/connectors/maker.json"),
    uniswap: require("./abi/connectors/uniswap.json"),
  },
  read: {
    core: require("./abi/read/core.json"),
    compound: require("./abi/read/compound.json"),
    maker: require("./abi/read/maker.json"),
    erc20: require("./abi/read/erc20.json"),
  },
  basic: {
    erc20: require("./abi/basics/erc20.json"),
  },
} as ABIS;
