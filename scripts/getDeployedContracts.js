const abis = require("./constant/abis");
const addresses = require("./constant/addresses");
const { expect } = require("chai");

const hre = require("hardhat");
const { ethers, deployments } = hre;
const fs = require("fs/promises");

module.exports = async function () {
  const chainId = hre.network.config.chainId;
  const contracts = JSON.parse(
    await fs.readFile("docs/addresses.json", { encoding: "utf8" })
  );
  const network = Object.keys(contracts);
  const isPolygon = chainId === 137;
  const destructured = flattenObject(
    contracts[isPolygon ? "polygon" : "mainnet"]
  );

  const contractInstances = {};
  for (const key in destructured) {
    contractInstances[key] = await ethers.getContractAt(key, destructured[key]);
  }

  return contractInstances;
};

const flattenObject = (obj) => {
  const flattened = {};
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      Object.assign(flattened, flattenObject(obj[key]));
    } else {
      flattened[key] = obj[key];
    }
  });
  return flattened;
};
