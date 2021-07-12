import abis from "./constant/abis";
import addresses from "./constant/addresses";
import { ethers } from "hardhat";
import { AbiItem } from "web3-utils";

export interface deployConnectorArgs {
  connectorName: string;
  contract: string;
  abi: AbiItem[];
}

export default async function deployConnector({
  connectorName,
  contract,
  abi,
}: deployConnectorArgs) {
  const ConnectorInstanceFactory = await ethers.getContractFactory(contract);
  const connectorInstance = await ConnectorInstanceFactory.deploy();
  await connectorInstance.deployed();

  addresses.connectors[connectorName] = connectorInstance.address;
  abis.connectors[connectorName] = abi;

  return connectorInstance;
}
