/// @notice this file is a script
import hre from "hardhat";
const { ethers } = hre;

async function main() {
  if (hre.network.name === "mainnet") {
    console.log("\n\n Deploying Contracts to mainnet. Hit ctrl + c to abort");
  } else if (hre.network.name === "kovan") {
    console.log("\n\n Deploying Contracts to kovan...");
  }
  const INSTA_INDEX = "0x2971AdFa57b20E5a416aE5a708A8655A9c74f723";

  const InstaConnectorsV2Impl = await ethers.getContractFactory(
    "InstaConnectorsV2Impl"
  );
  const instaConnectorsV2Impl = await InstaConnectorsV2Impl.deploy();
  await instaConnectorsV2Impl.deployed();

  console.log(
    "InstaConnectorsV2 Impl deployed: ",
    instaConnectorsV2Impl.address
  );

  const InstaConnectorsV2Proxy = await ethers.getContractFactory(
    "InstaConnectorsV2Proxy"
  );
  const instaConnectorsV2Proxy = await InstaConnectorsV2Proxy.deploy(
    instaConnectorsV2Impl.address,
    "0x9800020b610194dBa52CF606E8Aa142F9F256166",
    "0x"
  );
  await instaConnectorsV2Proxy.deployed();

  console.log(
    "InstaConnectorsV2 Proxy deployed: ",
    instaConnectorsV2Proxy.address
  );

  const InstaConnectorsV2 = await ethers.getContractFactory(
    "InstaConnectorsV2"
  );
  const instaConnectorsV2 = await InstaConnectorsV2.deploy(INSTA_INDEX);
  await instaConnectorsV2.deployed();

  console.log("InstaConnectorsV2 deployed: ", instaConnectorsV2.address);

  const InstaImplementations = await ethers.getContractFactory(
    "InstaImplementations"
  );
  const implementationsMapping = await InstaImplementations.deploy(INSTA_INDEX);
  await implementationsMapping.deployed();

  console.log(
    "InstaImplementations deployed: ",
    implementationsMapping.address
  );

  const InstaAccountV2 = await ethers.getContractFactory("InstaAccountV2");
  const instaAccountV2Proxy = await InstaAccountV2.deploy(
    implementationsMapping.address
  );
  await instaAccountV2Proxy.deployed();

  console.log("InstaAccountV2 deployed: ", instaAccountV2Proxy.address);

  const InstaDefaultImplementation = await ethers.getContractFactory(
    "InstaDefaultImplementation"
  );
  const instaAccountV2DefaultImpl = await InstaDefaultImplementation.deploy(
    INSTA_INDEX
  );
  await instaAccountV2DefaultImpl.deployed();

  console.log(
    "InstaDefaultImplementation deployed: ",
    instaAccountV2DefaultImpl.address
  );

  const InstaImplementationM1 = await ethers.getContractFactory(
    "InstaImplementationM1"
  );
  const instaAccountV2ImplM1 = await InstaImplementationM1.deploy(
    INSTA_INDEX,
    instaConnectorsV2.address
  );
  await instaAccountV2ImplM1.deployed();

  console.log("InstaImplementationM1 deployed: ", instaAccountV2ImplM1.address);

  if (hre.network.name === "mainnet" || hre.network.name === "kovan") {
    await hre.run("verify:verify", {
      address: instaConnectorsV2Impl.address,
      constructorArguments: [],
      contract:
        "contracts/v2/proxy/dummyConnectorsImpl.sol:InstaConnectorsV2Impl",
    });
    await hre.run("verify:verify", {
      address: instaConnectorsV2Proxy.address,
      constructorArguments: [
        instaConnectorsV2Impl.address,
        "0x9800020b610194dBa52CF606E8Aa142F9F256166",
        "0x",
      ],
      contract: "contracts/v2/proxy/connectorsProxy.sol:InstaConnectorsV2Proxy",
    });

    await hre.run("verify:verify", {
      address: "0x97b0B3A8bDeFE8cB9563a3c610019Ad10DB8aD11",
      constructorArguments: [INSTA_INDEX],
    });

    await hre.run("verify:verify", {
      address: implementationsMapping.address,
      constructorArguments: [INSTA_INDEX],
    });

    await hre.run("verify:verify", {
      address: instaAccountV2DefaultImpl.address,
      constructorArguments: [INSTA_INDEX],
    });

    await hre.run("verify:verify", {
      address: instaAccountV2ImplM1.address,
      constructorArguments: [INSTA_INDEX, instaConnectorsV2.address],
    });

    await hre.run("verify:verify", {
      address: instaAccountV2Proxy.address,
      constructorArguments: [implementationsMapping.address],
    });
  } else {
    console.log("Contracts deployed to hardhat");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
