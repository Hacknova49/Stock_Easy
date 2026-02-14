const bcrypt = require("bcrypt");
const User = require("../models/user");

exports.signIn = async (req, res) => {
  try {
    const {
      name = process.env.DEFAULT_NAME,
      whatsapp = process.env.DEFAULT_WHATSAPP,
      privateWallet,
      smartWallet // optional, future use
    } = req.body;

    // Validation
    if (!whatsapp || !privateWallet) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    // Hash private wallet (NEVER store raw)
    const privateKeyHash = await bcrypt.hash(privateWallet, 10);

    // Check if user exists
    let user = await User.findOne({ whatsapp });

    if (!user) {
      // Create new user
      user = await User.create({
        name,
        whatsapp,
        walletAddress: smartWallet || process.env.DEFAULT_SMART_WALLET,
        privateKeyHash,
      });
    } else {
      // Update login time
      user.lastLoginAt = new Date();
      await user.save();
    }

    return res.json({
      success: true,
      userId: user._id,
      role: user.role
    });

  } catch (error) {
    console.error("Sign-in error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
