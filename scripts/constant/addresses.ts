type Addresses = { [key in "connectors" | "read"]: { [key: string]: string } };
export default {
  connectors: {
    basic: "0xe5398f279175962E56fE4c5E0b62dc7208EF36c6",
    auth: "0xd1aff9f2acf800c876c409100d6f39aea93fc3d9",
    compound: "0x07F81230d73a78f63F0c2A3403AD281b067d28F8",
    maker: "0x6c4E4D4aB22cAB08b8498a3A232D92609e8b2d62",
    uniswap: "0x62EbfF47B2Ba3e47796efaE7C51676762dC961c0",
  },
  read: {
    core: "0x621AD080ad3B839e7b19e040C77F05213AB71524",
    erc20: "0x6d9c624844e61280c19fd7ef588d79a6de893d64",
    compound: "0x1f22D77365d8BFE3b901C33C83C01B584F946617",
    maker: "0x0A7008B38E7015F8C36A49eEbc32513ECA8801E5",
    uniswap: "0x492e5f3f01d20513fc0d53ca0215b6499faec8a0",
  },
} as Addresses;
