const abis = require("./constant/abis");
const addresses = require("./constant/addresses");
const { expect } = require("chai");

const hre = require("hardhat");
const { ethers, deployments } = hre;

module.exports = async function ({
  instaIndex,
  owner,
  defaultImplementation,
  implementations,
  origin,
}) {
  if (!origin) origin = owner;
  const tx = await instaIndex
    .connect(owner)
    .build(owner.address, 2, origin.address);

  const receipt = await tx.wait();
  const dsaWalletAddress = receipt.events[1].args.account;
  const walletInstances = {};
  if (!!defaultImplementation)
    walletInstances = await ethers.getContractAt(
      defaultImplementation,
      dsaWalletAddress
    );

  for (let i = 0; i < implementations.length; i++) {
    const implementation = implementations[i];
    walletInstances[implementation] = await ethers.getContractAt(
      implementation,
      dsaWalletAddress
    );
  }

  return walletInstances;
};
