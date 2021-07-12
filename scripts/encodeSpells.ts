import abis from "./constant/abis";
import { web3 } from "hardhat";

interface Spell {
  connector: string;
  method: string;
  args: any[];
}

export default function encodeSpells(spells: Spell[]): [string[], string[]] {
  const targets = spells.map((a) => a.connector);
  const calldatas = spells.map((a) => {
    const functionName = a.method;
    const abi = abis.connectors[a.connector].find((b) => {
      return b.name === functionName;
    });
    if (!abi) throw new Error("Couldn't find function");
    return web3.eth.abi.encodeFunctionCall(abi, a.args);
  });
  return [targets, calldatas];
}
