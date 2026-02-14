const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const router = express.Router();

router.post("/signin", async (req, res) => {
  try {
    const {
      name = process.env.DEFAULT_NAME,
      whatsapp = process.env.DEFAULT_WHATSAPP,
      privateWallet,
      smartWallet = process.env.DEFAULT_SMART_WALLET
    } = req.body;

    // Minimum required fields
    if (!whatsapp || !privateWallet) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if user exists
    let user = await User.findOne({ whatsapp });

    if (user) {
      // Verify private key
      const isMatch = await bcrypt.compare(
        privateWallet,
        user.privateKeyHash
      );

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      user.lastLoginAt = new Date();
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Sign in successful",
        userId: user._id
      });
    }

    // Hash private key
    const privateKeyHash = await bcrypt.hash(privateWallet, 10);

    // Create new user
    user = await User.create({
      name,
      whatsapp,
      walletAddress: smartWallet,
      privateKeyHash
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: user._id
    });

  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
