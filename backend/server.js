require("dotenv").config();
const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");

const { ethers } = require("ethers");
const {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient
} = require("@zerodev/sdk");
const { KERNEL_V3_1, getEntryPoint } = require("@zerodev/sdk/constants");
const { signerToEcdsaValidator } = require("@zerodev/ecdsa-validator");
const { http, createPublicClient } = require("viem");
const { polygonAmoy } = require("viem/chains");
const { privateKeyToAccount } = require("viem/accounts");

const User = require("./models/user");

const app = express();
app.use(express.json());
app.use(cors());

/* -------------------- DATABASE -------------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

/* -------------------- INVENTORY -------------------- */

let inventory = { Milk: 10, Bread: 5 };
let smartAccountClient = null;

/* -------------------- DEFAULT SESSION (FALLBACK) -------------------- */

const sessions = {
  shop_123: {
    merchantAddress: process.env.DEFAULT_SUPPLIER_ADDRESS,
    dailyLimit: 2000,
    perTxLimit: 200,
    spentToday: 0,
    expiry: Date.now() + 30 * 24 * 60 * 60 * 1000
  }
};

/* -------------------- AUTH (WHATSAPP BASED) -------------------- */

app.post("/api/auth/signin", async (req, res) => {
  try {
    const { name, whatsapp, walletAddress, privateKey } = req.body;

    if (!name || !whatsapp || !walletAddress || !privateKey) {
      return res.status(400).json({ error: "All fields required" });
    }

    let user = await User.findOne({ whatsapp });

    if (user) {
      const valid = await bcrypt.compare(privateKey, user.privateKeyHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      user.lastLoginAt = new Date();
      await user.save();

      return res.json({
        success: true,
        message: "Login successful",
        user: {
          name: user.name,
          whatsapp: user.whatsapp,
          walletAddress: user.walletAddress
        }
      });
    }

    const hash = await bcrypt.hash(privateKey, 10);

    user = await User.create({
      name,
      whatsapp,
      walletAddress,
      privateKeyHash: hash
    });

    res.status(201).json({
      success: true,
      message: "User registered",
      user: {
        name,
        whatsapp,
        walletAddress
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- SMART ACCOUNT INIT -------------------- */

async function initializeSmartAccount() {
  const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: http(process.env.POLYGON_RPC_URL)
  });

  const signer = privateKeyToAccount(process.env.SESSION_PRIVATE_KEY);
  const entryPoint = getEntryPoint("0.7");

  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint,
    kernelVersion: KERNEL_V3_1
  });

  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: ecdsaValidator },
    entryPoint,
    kernelVersion: KERNEL_V3_1
  });

  smartAccountClient = createKernelAccountClient({
    account,
    chain: polygonAmoy,
    bundlerTransport: http(
      `https://rpc.zerodev.app/api/v2/bundler/${process.env.ZERODEV_PROJECT_ID}`
    ),
    paymaster: createZeroDevPaymasterClient({
      chain: polygonAmoy,
      transport: http(
        `https://rpc.zerodev.app/api/v2/paymaster/${process.env.ZERODEV_PROJECT_ID}`
      )
    })
  });

  console.log(`🚀 Smart Account Ready: ${account.address}`);
}

/* -------------------- AUTONOMOUS AI LOGIC -------------------- */

async function runAutonomousOrder() {
  try {
    const aiResponse = await axios.get("http://127.0.0.1:8000/restock-items");
    const { risk_level } = aiResponse.data;

    if (risk_level === "high" || inventory.Milk < 3) {
      const userOpHash = await smartAccountClient.sendUserOperation({
        callData: await smartAccountClient.account.encodeCalls([
          {
            to: process.env.DEFAULT_SUPPLIER_ADDRESS,
            value: ethers.parseEther("0.001"),
            data: "0x"
          }
        ])
      });

      console.log(`🤖 Autonomous Payment Sent: ${userOpHash}`);
      inventory.Milk += 10;
    }
  } catch (err) {
    console.error("❌ Autonomous Order Failed:", err.message);
  }
}

/* -------------------- AUTOPAY (WHATSAPP BASED) -------------------- */

async function autoPay(whatsapp, amount) {
  const user = await User.findOne({ whatsapp });
  if (!user) throw new Error("USER NOT FOUND");

  const payToAddress =
    user.walletAddress || process.env.DEFAULT_SUPPLIER_ADDRESS;

  const userOpHash = await smartAccountClient.sendUserOperation({
    callData: await smartAccountClient.account.encodeCalls([
      {
        to: payToAddress,
        value: ethers.parseEther("0.0001"),
        data: "0x"
      }
    ])
  });

  return userOpHash;
}

app.post("/api/autopay", async (req, res) => {
  try {
    const { whatsapp, amount, product } = req.body;

    const txHash = await autoPay(whatsapp, amount);

    res.json({
      success: true,
      product,
      txHash
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/* -------------------- DEMO -------------------- */

app.get("/demo-start", async (req, res) => {
  setInterval(async () => {
    inventory.Milk--;
    if (inventory.Milk < 3) await runAutonomousOrder();
  }, 5000);

  res.send("Autonomous Smart Account Demo Started");
});

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 3000;

initializeSmartAccount().then(() => {
  app.listen(PORT, () =>
    console.log(`✅ Backend running on port ${PORT}`)
  );
});
