const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

async function main() {
  const network = await provider.getNetwork();
  console.log("Chain ID:", network.chainId);

  const balance = await provider.getBalance(process.env.SUPPLIER_ADDRESS);
  console.log("Balance:", ethers.formatEther(balance));
}

main().catch(console.error);
