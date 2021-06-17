const { expect } = require("chai");
const getMasterSigner = require("../scripts/getMasterSigner");
const hre = require("hardhat");
const deployDSAv2 = require("../scripts/deployDSAv2");
const getDeployedContacts = require("../scripts/getDeployedContracts");
const { ethers, web3 } = hre;
const encodeSpells = require("../scripts/encodeSpells.js");

describe("Flashloan Core", () => {
  const daiAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const ethAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const maxValue =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";
  const instaAccountV2ImplM2Sigs = [
    "cast(string[],bytes[],address,uint256,uint256,address)",
    "flashCallback(address,address,uint256,string[],bytes[],address)",
  ].map((sig) => web3.utils.keccak256(sig).slice(0, 10));
  let accountV2ImplM2;
  let instaIndex;
  let wallet, masterSigner;
  let accountDSAM2Wallet;
  let deployedContracts;
  let implementationsMapping;
  let _instaAccountV2ImplM2;
  let origin;

  before(async () => {
    [wallet] = await ethers.getSigners();
    origin = wallet.address;
    deployedContracts = await getDeployedContacts();
    implementationsMapping = deployedContracts["InstaImplementations"];

    instaIndex = await ethers.getContractAt(
      "InstaIndex",
      hre.network.config.instaIndexAddress
    );

    masterSigner = await getMasterSigner();
    const InstaImplementationM2 = await ethers.getContractFactory(
      "InstaImplementationM2"
    );
    _instaAccountV2ImplM2 = await InstaImplementationM2.deploy(
      "0x2971AdFa57b20E5a416aE5a708A8655A9c74f723",
      "0x97b0B3A8bDeFE8cB9563a3c610019Ad10DB8aD11",
      "0x2a1739d7f07d40e76852ca8f0d82275aa087992f"
    );
    await _instaAccountV2ImplM2.deployed();
    console.log("instaAccountV2ImplM2", _instaAccountV2ImplM2.address);
  });

  describe("test Implementation M2", () => {
    it("It should deploy dsa v2", async function () {
      const dsa = await deployDSAv2({
        instaIndex,
        owner: wallet,
        origin: wallet,
        implementations: ["InstaImplementationM2"],
      });
      accountDSAM2Wallet = dsa["InstaImplementationM2"];

      // send some eth to dsa wallet
      const amt = ethers.utils.parseEther("1");
      await wallet.sendTransaction({
        value: amt,
        to: accountDSAM2Wallet.address,
      });
    });

    it("Should add instaAccountV2ImplM2 sigs to mapping.", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .addImplementation(
          _instaAccountV2ImplM2.address,
          instaAccountV2ImplM2Sigs
        );
      await tx.wait();
    });

    it("Should enable sigs in the instapool", async function () {
      const abi = ["function whitelistSigs(bytes4[], bool[])"];
      const instaPoolContract = new ethers.Contract(
        "0x2a1739d7f07d40e76852ca8f0d82275aa087992f",
        abi,
        masterSigner
      );

      const tx = await instaPoolContract.whitelistSigs(
        [instaAccountV2ImplM2Sigs[1]],
        [true]
      );

      await tx.wait();
    });

    it("Cast ETH with Flashloan - Compound", async () => {
      const amt = ethers.utils.parseEther("100");
      const spells = [
        {
          connector: "COMPOUND-A",
          method: "deposit",
          args: ["ETH-A", maxValue, 0, 12122],
        },
        {
          connector: "COMPOUND-A",
          method: "withdraw",
          args: ["ETH-A", 0, 12122, 0],
        },
      ];

      const promise = accountDSAM2Wallet.cast(
        ...encodeSpells(spells),
        ethAddr,
        amt,
        0,
        origin
      );

      await expect(promise)
        .to.emit(accountDSAM2Wallet, "LogFlashCast")
        .withArgs(origin, ethAddr, amt, 0); // use dydx hence route is 0
    });

    it("Cast DAI with Flashloan on Compound (flashloan via dydx)", async () => {
      // So according to etherscan, dydx usually has 26M DAI
      // let's send a little below that aroudn 20M?
      let amt = ethers.utils.parseEther("20000000");
      const route = 0; // dydx
      const spells = [
        {
          connector: "COMPOUND-A",
          method: "deposit",
          args: ["DAI-A", maxValue, 0, 12122],
        },
        {
          connector: "COMPOUND-A",
          method: "withdraw",
          args: ["DAI-A", 0, 12122, 0],
        },
      ];

      let txPromise = accountDSAM2Wallet.cast(
        ...encodeSpells(spells),
        daiAddr,
        amt,
        route,
        wallet.address
      );

      await expect(txPromise)
        .to.emit(accountDSAM2Wallet, "LogFlashCast")
        .withArgs(origin, daiAddr, amt, route); // uses dydx hence route is 0

      // should revert on higher liquidity
      txPromise = accountDSAM2Wallet.cast(
        ...encodeSpells(spells),
        daiAddr,
        amt.mul(2), // multiply 20m with 2 = 40M, >dydx liquidity
        route,
        wallet.address
      );

      await expect(txPromise).to.revertedWith("Dai/insufficient-balance");
    });

    const routes = ["maker", "compound", "aave"];

    for (let i = 0; i < routes.length; i++) {
      it(`Cast DAI with Flashloan on Compound (flashloan via ${routes[i]})`, async () => {
        const route = i + 1;
        const amt = ethers.utils.parseEther("50000000");
        const spells = [
          {
            connector: "COMPOUND-A",
            method: "deposit",
            args: ["DAI-A", maxValue, 0, 12122],
          },
          {
            connector: "COMPOUND-A",
            method: "withdraw",
            args: ["DAI-A", 0, 12122, 0],
          },
        ];

        const promise = accountDSAM2Wallet.cast(
          ...encodeSpells(spells),
          daiAddr,
          amt,
          route,
          wallet.address
        );

        await expect(promise)
          .to.emit(accountDSAM2Wallet, "LogFlashCast")
          .withArgs(origin, daiAddr, amt, route);
      });
    }
  });
});
