import hre from "hardhat";
const { ethers } = hre;

async function main() {
  if (hre.network.name === "mainnet") {
    console.log("\n\n Deploying Contracts to mainnet. Hit ctrl + c to abort");
  } else if (hre.network.name === "kovan") {
    console.log("\n\n Deploying Contracts to kovan...");
  }

  const masterSig = "0xb1DC62EC38E6E3857a887210C38418E4A17Da5B2";

  const InstaTimelockContract = await ethers.getContractFactory(
    "InstaTimelockContract"
  );
  const instaTimelockContract = await InstaTimelockContract.deploy([masterSig]);
  await instaTimelockContract.deployed();

  console.log(
    "InstaTimelockContract deployed: ",
    instaTimelockContract.address
  );

  if (hre.network.name === "mainnet" || hre.network.name === "kovan") {
    await hre.run("verify:verify", {
      address: instaTimelockContract.address,
      constructorArguments: [],
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
