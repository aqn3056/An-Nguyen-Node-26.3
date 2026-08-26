const crypto = require("crypto");
const util = require("util");
const prisma = require("../db/prisma");
const { userSchema } = require("../validation/userSchema");

const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  if (!inputPassword || !storedHash) return false;

  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const storedKey = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);

  if (storedKey.length !== derivedKey.length) return false;

  return crypto.timingSafeEqual(storedKey, derivedKey);
}

async function register(req, res, next) {
  if (!req.body) req.body = {};

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ message });
  }

  value.email = value.email.trim().toLowerCase();

  let existingUser = null;

  try {
    existingUser = await prisma.user.findUnique({
      where: { email: value.email },
    });
  } catch (e) {
    return next(e);
  }

  if (existingUser) {
    return res.status(400).json({ message: "That email is already in use." });
  }

  value.hashedPassword = await hashPassword(value.password);
  delete value.password;

  let user = null;

  try {
    user = await prisma.user.create({
      data: value,
      select: { name: true, email: true, id: true },
    });
  } catch (e) {
    if (e.code === "P2002") {
      return res.status(400).json({ message: "That email is already in use." });
    }
    return next(e);
  }

  global.user_id = Number(user.id);

  res.status(201).json({
    name: user.name,
    email: user.email,
  });
}

async function logon(req, res, next) {
  if (!req.body) req.body = {};

  const { email, password } = req.body;

  if (!email || !password || typeof email !== "string") {
    return res.status(401).json({
      message: "Authentication failed.",
    });
  }

  let user = null;

  try {
    user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  } catch (e) {
    return next(e);
  }

  if (!user) {
    return res.status(401).json({
      message: "Authentication failed.",
    });
  }

  const passwordMatches = await comparePassword(password, user.hashedPassword);

  if (!passwordMatches) {
    return res.status(401).json({
      message: "Authentication failed.",
    });
  }

  global.user_id = Number(user.id);

  res.status(200).json({
    name: user.name,
    email: user.email,
  });
}

function logoff(req, res) {
  global.user_id = null;

  res.status(200).json({
    message: "You have been logged off.",
  });
}

module.exports = {
  register,
  logon,
  logoff,
};
