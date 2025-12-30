require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { ethers } = require('ethers');
const { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } = require("@zerodev/sdk");
const { KERNEL_V3_1, getEntryPoint } = require("@zerodev/sdk/constants");
const { signerToEcdsaValidator } = require("@zerodev/ecdsa-validator");
const { http, createPublicClient } = require("viem");
const { polygonAmoy } = require("viem/chains");

const app = express();
app.use(express.json());

let inventory = { "Milk": 10, "Bread": 5 };
let smartAccountClient = null;

// --- INITIALIZATION ---


        const { privateKeyToAccount } = require("viem/accounts"); // Add this import at the top

async function initializeSmartAccount() {
    const publicClient = createPublicClient({
        chain: polygonAmoy,
        transport: http(process.env.POLYGON_RPC_URL),
    });

    // FIX: Use viem's privateKeyToAccount instead of ethers wallet
    const signer = privateKeyToAccount(process.env.PRIVATE_KEY); 
    const entryPoint = getEntryPoint("0.7");

    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer, // Now this contains the 'address' property ZeroDev is looking for
        entryPoint,
        kernelVersion: KERNEL_V3_1,
    });

    const account = await createKernelAccount(publicClient, {
        plugins: { sudo: ecdsaValidator },
        entryPoint,
        kernelVersion: KERNEL_V3_1,
    });

    smartAccountClient = createKernelAccountClient({
        account,
        chain: polygonAmoy,
        bundlerTransport: http(`https://rpc.zerodev.app/api/v2/bundler/${process.env.ZERODEV_PROJECT_ID}`),
        paymaster: createZeroDevPaymasterClient({
            chain: polygonAmoy,
            transport: http(`https://rpc.zerodev.app/api/v2/paymaster/${process.env.ZERODEV_PROJECT_ID}`),
        }),
    });

    console.log(`🚀 Smart Account Ready: ${account.address}`);
}

// --- AUTONOMOUS LOGIC ---

async function runAutonomousOrder() {
    try {
        const aiResponse = await axios.get('http://127.0.0.1:8000/predict');
        const { risk_level, product_name } = aiResponse.data;

        if (risk_level === "high" || inventory.Milk < 3) {
            console.log(`🤖 AI Risk High for ${product_name}. Executing Session Payment...`);

            // This sends a "UserOperation" (Account Abstraction transaction)
            const userOpHash = await smartAccountClient.sendUserOperation({
                callData: await smartAccountClient.account.encodeCalls([{
                    to: process.env.SUPPLIER_ADDRESS,
                    value: ethers.parseEther("0.001"),
                    data: "0x",
                }]),
            });

            console.log(`💰 Payment Sent! UserOp Hash: ${userOpHash}`);
            inventory.Milk += 10; 
        }
    } catch (error) {
        console.error("❌ Session Payment Failed:", error.message);
    }
}

// --- ROUTES ---

app.get('/demo-start', async (req, res) => {
    // Basic simulation logic...
    setInterval(async () => {
        if (inventory.Milk > 0) {
            inventory.Milk--;
            if (inventory.Milk < 3) await runAutonomousOrder();
        }
    }, 5000);
    res.send("Autonomous Smart Account Demo Started.");
});

const PORT = 3000;
initializeSmartAccount().then(() => {
    app.listen(PORT, () => console.log(`Backend live on port ${PORT}`));
});