// Run this with: node test-payment.js
require('dotenv').config();
const { createPublicClient, http, parseEther } = require("viem");
const { polygonAmoy } = require("viem/chains");
const { privateKeyToAccount } = require("viem/accounts");
const { createKernelAccountClient } = require("@zerodev/sdk");
const { KERNEL_V3_1, getEntryPoint } = require("@zerodev/sdk/constants");

// FIX: Import deserialize from /permissions and toECDSASigner from /signers
const { deserializePermissionAccount } = require("@zerodev/permissions");
const { toECDSASigner } = require("@zerodev/permissions/signers");

async function testAutoPay() {
    console.log("--- Environment Check ---");
    console.log("PROJECT_ID: Found");
    console.log("SESSION_PRIVATE_KEY: Found");
    console.log("SERIALIZED_SESSION: Found");
    console.log("-------------------------\n");

    const publicClient = createPublicClient({ 
        chain: polygonAmoy, 
        transport: http("https://rpc-amoy.polygon.technology") 
    });
    const entryPoint = getEntryPoint("0.7");

    // 1. Prepare the Agent's Signer (The Backend Key)
    const sessionKeyAccount = privateKeyToAccount(process.env.SESSION_PRIVATE_KEY);
    const sessionKeySigner = await toECDSASigner({
        signer: sessionKeyAccount,
    });

    console.log("⏳ De-serializing session for Shopkeeper...");

    // 2. Reconstruct the Smart Account
    const account = await deserializePermissionAccount(
        publicClient, 
        entryPoint, 
        KERNEL_V3_1, 
        process.env.SERIALIZED_SESSION,
        sessionKeySigner 
    );

    // 3. Setup the Client
    const kernelClient = createKernelAccountClient({
        account,
        chain: polygonAmoy,
        bundlerTransport: http(`https://rpc.zerodev.app/api/v3/bundler/${process.env.ZERODEV_PROJECT_ID}`),
    });

    console.log("💼 Smart Account Address:", account.address);
    // Check balance before sending
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`💰 Smart Account Balance: ${balance.toString()} wei`);

    if (balance === 0n) {
        console.log("⚠️ WARNING: Your Smart Account is empty!");
        console.log(`Please send some test MATIC to: ${account.address}`);
        return; // Stop here so you don't waste a request
    }
    // 4. Send a tiny 0.0001 MATIC transaction to verify
    console.log("🚀 Attempting automated payment...");
    const txHash = await kernelClient.sendTransaction({
        to: "0x4C2c3EcB63647E34Bd473A1DEc2708D365806Ed2",
        value: parseEther("0.0001"),
    });

    console.log(`\n✅ SUCCESS! Shopkeeper Auto-Payment is LIVE.`);
    console.log(`🔗 Transaction: https://amoy.polygonscan.com/tx/${txHash}`);
}

testAutoPay().catch((err) => {
    console.error("❌ Error Details:");
    console.error(err);
});