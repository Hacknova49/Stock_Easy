const { createPublicClient, http } = require("viem");
const { polygonAmoy } = require("viem/chains");
const { privateKeyToAccount, generatePrivateKey } = require("viem/accounts");
const { createKernelAccount } = require("@zerodev/sdk");
const { KERNEL_V3_1, getEntryPoint } = require("@zerodev/sdk/constants");
const { toECDSASigner } = require("@zerodev/permissions/signers"); // Import this!
const { toSudoPolicy } = require("@zerodev/permissions/policies");
const { toPermissionValidator, serializePermissionAccount } = require("@zerodev/permissions");
const { signerToEcdsaValidator } = require("@zerodev/ecdsa-validator");

const cleanKey = (key) => {
    const k = key.trim();
    return k.startsWith('0x') ? k : `0x${k}`;
};

async function main() {
    const publicClient = createPublicClient({ 
        chain: polygonAmoy, 
        transport: http("https://rpc-amoy.polygon.technology") 
    });
    const entryPoint = getEntryPoint("0.7");

    // 1. MASTER KEY (MetaMask)
    const masterSigner = privateKeyToAccount(cleanKey("c9927ada38975776f1f51dfe856b6e6581e933609dba6897ba11dbe36391d365"));
                                                       
    // 2. AGENT KEY (Randomly generated)
    const agentPrivateKey = generatePrivateKey(); 
    const sessionKeyAccount = privateKeyToAccount(agentPrivateKey);

    // --- FIX STARTS HERE ---
    // We must wrap the session account in an ECDSA Signer object
    const sessionKeySigner = await toECDSASigner({
        signer: sessionKeyAccount,
    });
    // --- FIX ENDS HERE ---

    console.log("⏳ Creating the Shopkeeper's Permission Slip...");

    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer: masterSigner,
        entryPoint,
        kernelVersion: KERNEL_V3_1,
    });

    const permissionValidator = await toPermissionValidator(publicClient, {
        entryPoint,
        kernelVersion: KERNEL_V3_1,
        signer: sessionKeySigner, // Use the WRAPPED signer here
        policies: [toSudoPolicy({})], 
    });

    const sessionAccount = await createKernelAccount(publicClient, {
        entryPoint,
        kernelVersion: KERNEL_V3_1,
        plugins: {
            sudo: ecdsaValidator,
            regular: permissionValidator,
        },
    });

    const serializedSession = await serializePermissionAccount(sessionAccount);
    
    console.log("\n--- ✅ COPY THESE TO YOUR .ENV ---");
    console.log(`SESSION_PRIVATE_KEY="${agentPrivateKey}"`);
    console.log(`SERIALIZED_SESSION="${serializedSession}"`);
    console.log("----------------------------------\n");
}

main().catch((err) => console.error("❌ Error:", err));