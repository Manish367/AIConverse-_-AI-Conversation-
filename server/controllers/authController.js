const User = require("../models/users");
const { signToken } = require("../config/jwt");
const { hashPassword, comparePassword } = require("../utils/hash");

async function register(req, res) {
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    name: name || email.split("@")[0],
    passwordHash,
  });

  res.json({
    token: signToken(user),
    user: { id: user._id, email: user.email, name: user.name },
  });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  res.json({
    token: signToken(user),
    user: { id: user._id, email: user.email, name: user.name },
  });
}

module.exports = { register, login };
