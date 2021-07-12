import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { INSTA_INDEX } from "../store";
import { InstaIndex } from "../typechain";

export default async function getMasterSigner() {
  const signer = (await ethers.getSigners())[0];
  const instaIndex = <InstaIndex>(
    await ethers.getContractAt("InstaIndex", INSTA_INDEX)
  );

  const masterAddress = await instaIndex.master();
  await signer.sendTransaction({
    to: masterAddress,
    value: parseEther("10"),
  });

  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [masterAddress],
  });

  return await ethers.provider.getSigner(masterAddress);
}
