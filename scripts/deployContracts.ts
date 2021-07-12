import hre from "hardhat";
import { INSTA_INDEX } from "../store";
import {
  InstaAccountV2__factory,
  InstaConnectorsV2__factory,
  InstaDefaultImplementation__factory,
  InstaImplementationM1__factory,
  InstaImplementationM2__factory,
  InstaImplementations__factory,
  InstaIndex,
} from "../typechain";
const { ethers } = hre;

export default async function deployContracts() {
  const instaIndex = <InstaIndex>(
    await ethers.getContractAt("InstaIndex", INSTA_INDEX)
  );

  const InstaConnectorsV2 = <InstaConnectorsV2__factory>(
    await ethers.getContractFactory("InstaConnectorsV2")
  );
  const instaConnectorsV2 = await InstaConnectorsV2.deploy(instaIndex.address);
  await instaConnectorsV2.deployed();

  const InstaImplementations = <InstaImplementations__factory>(
    await ethers.getContractFactory("InstaImplementations")
  );
  const implementationsMapping = await InstaImplementations.deploy(
    instaIndex.address
  );
  await implementationsMapping.deployed();

  const InstaAccountV2 = <InstaAccountV2__factory>(
    await ethers.getContractFactory("InstaAccountV2")
  );
  const instaAccountV2Proxy = await InstaAccountV2.deploy(
    implementationsMapping.address
  );
  await instaAccountV2Proxy.deployed();

  const InstaDefaultImplementation = <InstaDefaultImplementation__factory>(
    await ethers.getContractFactory("InstaDefaultImplementation")
  );
  const instaAccountV2DefaultImpl = await InstaDefaultImplementation.deploy(
    instaIndex.address
  );
  await instaAccountV2DefaultImpl.deployed();

  const InstaImplementationM1 = <InstaImplementationM1__factory>(
    await ethers.getContractFactory("InstaImplementationM1")
  );
  const instaAccountV2ImplM1 = await InstaImplementationM1.deploy(
    instaIndex.address,
    instaConnectorsV2.address
  );
  await instaAccountV2ImplM1.deployed();

  const InstaImplementationM2 = <InstaImplementationM2__factory>(
    await ethers.getContractFactory("InstaImplementationM2")
  );
  const instaAccountV2ImplM2 = await InstaImplementationM2.deploy(
    instaIndex.address,
    instaConnectorsV2.address
  );
  await instaAccountV2ImplM2.deployed();

  return {
    instaIndex,
    instaConnectorsV2,
    implementationsMapping,
    instaAccountV2Proxy,
    instaAccountV2DefaultImpl,
    instaAccountV2ImplM1,
    instaAccountV2ImplM2,
  };
}
