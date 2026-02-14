const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // User identity
  name: {
    type: String,
    required: true,
    trim: true
  },

  // WhatsApp number as primary user identifier
  whatsapp: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // User wallet / smart account address
  walletAddress: {
    type: String,
    required: true
  },

  // Hashed private key (NEVER store raw key)
  privateKeyHash: {
    type: String,
    required: true
  },

  // Optional future extensions
  role: {
    type: String,
    enum: ["user", "merchant", "admin"],
    default: "user"
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  lastLoginAt: {
    type: Date
  }
});

module.exports = mongoose.model("User", UserSchema);
