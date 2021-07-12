import { Contract, Signer } from "ethers";
import encodeSpells from "../encodeSpells";

export default async function addAuth(
  dsaWallet: Contract,
  userWallet: Signer,
  toAddAuthAddress: string
) {
  const spells = [
    {
      connector: "auth",
      method: "add",
      args: [toAddAuthAddress],
    },
  ];

  const tx = await dsaWallet
    .connect(userWallet)
    .cast(
      ...encodeSpells(spells),
      "0xA35f3FEFEcb5160327d1B6A210b60D1e1d7968e3"
    );
  return tx;
}
