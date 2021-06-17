const hre = require("hardhat");
const { ethers } = hre;

module.exports = async function () {
    const instaIndex = await ethers.getContractAt("InstaIndex", hre.network.config.instaIndexAddress)

    const masterAddress = await instaIndex.master(); // TODO: make it constant?
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [ masterAddress]
    })

    const [wallet0, wallet1, wallet2, wallet3] = await ethers.getSigners()
    await wallet3.sendTransaction({
        to: masterAddress,
        value: ethers.utils.parseEther("10")
    });

    return await ethers.getSigner(masterAddress);
};
