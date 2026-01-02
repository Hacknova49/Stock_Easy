// Run this with: node test-payment.js
require('dotenv').config();
const { createPublicClient, http, parseEther } = require("viem");
const { polygonAmoy } = require("viem/chains");
const { privateKeyToAccount } = require("viem/accounts");
const { createKernelAccountClient, createZeroDevPaymasterClient } = require("@zerodev/sdk"); // Added Paymaster Import
const { KERNEL_V3_1, getEntryPoint } = require("@zerodev/sdk/constants");
const { deserializePermissionAccount } = require("@zerodev/permissions");
const { toECDSASigner } = require("@zerodev/permissions/signers");

async function testAutoPay() {
    console.log("--- Environment Check ---");
    console.log("PROJECT_ID: Found");
    console.log("-------------------------\n");

    const publicClient = createPublicClient({ 
        chain: polygonAmoy, 
        transport: http("https://rpc-amoy.polygon.technology") 
    });
    const entryPoint = getEntryPoint("0.7");
    
    // The unified RPC URL for V3
    const ZERODEV_RPC = `https://rpc.zerodev.app/api/v3/${process.env.ZERODEV_PROJECT_ID}/chain/80002`;

    // 1. Prepare the Agent's Signer
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

    console.log("💼 Smart Account Address:", account.address);

    // 3. Setup the Paymaster and Client
    // const kernelClient = createKernelAccountClient({
    //     account,
    //     chain: polygonAmoy,
    //     bundlerTransport: http(ZERODEV_RPC),
    //     // This middleware tells the client to use the Paymaster for every transaction
    //     middleware: {
    //         sponsorUserOperation: async ({ userOperation }) => {
    //             const paymasterClient = createZeroDevPaymasterClient({
    //                 chain: polygonAmoy,
    //                 transport: http(ZERODEV_RPC),
    //                 entryPoint,
    //             });
    //             return paymasterClient.sponsorUserOperation({
    //                 userOperation,
    //                 entryPoint,
    //             });
    //         },
    //     },
    // });
const kernelClient = createKernelAccountClient({
    account,
    chain: polygonAmoy,
    bundlerTransport: http(`https://rpc.zerodev.app/api/v3/${process.env.ZERODEV_PROJECT_ID}/chain/80002`),
    
    // V3 uses this specific middleware structure for sponsorship
    paymaster: {
        type: "SPONSOR",
        paymasterClient: createZeroDevPaymasterClient({
            chain: polygonAmoy,
            transport: http(`https://rpc.zerodev.app/api/v3/${process.env.ZERODEV_PROJECT_ID}/chain/80002`),
            entryPoint,
        }),
    }
});
    // 4. Send a tiny 0.0001 MATIC transaction to verify
    console.log("🚀 Attempting automated payment (Sponsored)...");
    try {
        const txHash = await kernelClient.sendTransaction({
            to: "0x4C2c3EcB63647E34Bd473A1DEc2708D365806Ed2",
            value: parseEther("0.001"),
        });

        console.log(`\n✅ SUCCESS! Shopkeeper Auto-Payment is LIVE.`);
        console.log(`🔗 Transaction: https://amoy.polygonscan.com/tx/${txHash}`);
    } catch (err) {
        console.error("❌ Transaction Failed!");
        // If it still fails, it's likely a lack of "Gas Credits" on the Dashboard
        console.error(err.shortMessage || err.message);
    }
}
// const kernelClient = createKernelAccountClient({
//     account,
//     chain: polygonAmoy,
//     bundlerTransport: http(`https://rpc.zerodev.app/api/v3/${process.env.ZERODEV_PROJECT_ID}/chain/80002`),
    
//     // THE KEY LINE: This activates the "Sponsor All" policy you just saved
//     paymaster: { type: "SPONSOR" } 
// });
testAutoPay().catch((err) => {
    console.error("❌ Error Details:");
    console.error(err);
});