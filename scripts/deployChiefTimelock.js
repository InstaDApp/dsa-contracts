const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    if (hre.network.name === "mainnet") {
      console.log(
        "\n\n Deploying Contracts to mainnet. Hit ctrl + c to abort"
      );
    } else if (hre.network.name === "kovan") {
      console.log(
        "\n\n Deploying Contracts to kovan..."
      );
    }

    const chiefMultiSig = "0xa8c31E39e40E6765BEdBd83D92D6AA0B33f1CCC5"

    const InstaTimelockContract = await ethers.getContractFactory("InstaChiefTimelockContract");
    const instaTimelockContract = await InstaTimelockContract.deploy([chiefMultiSig]);
    await instaTimelockContract.deployed();

    console.log("InstaChiefTimelockContract deployed: ", instaTimelockContract.address);

    if (hre.network.name === "mainnet" || hre.network.name === "kovan") {
      await hre.run("verify:verify", {
          address: instaTimelockContract.address,
          constructorArguments: [[chiefMultiSig]],
        }
      )
    } else {
      console.log("Contracts deployed to hardhat")
    }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });