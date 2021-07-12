import { AbiItem } from "web3-utils";
import abis from "./constant/abis";
import addresses from "./constant/addresses";

export interface updateConnectorArgs {
  connectorName: string;
  address: string;
  abi: AbiItem[];
}

export default function enableConnector({
  connectorName,
  address,
  abi,
}: updateConnectorArgs) {
  addresses.connectors[connectorName] = address;
  abis.connectors[connectorName] = abi;

  return { addresses, abis };
}
