const crypto = require("crypto");
const util = require("util");
const pool = require("../db/pg-pool");
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

  const hashedPassword = await hashPassword(value.password);

  let result = null;

  try {
    result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, hashedPassword],
    );
  } catch (e) {
    if (e.code === "23505") {
      return res.status(400).json({ message: "That email is already in use." });
    }
    return next(e);
  }

  const newUser = result.rows[0];

  global.user_id = newUser.id;

  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
}

async function logon(req, res) {
  if (!req.body) req.body = {};

  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({
      message: "Authentication failed.",
    });
  }

  const passwordMatches = await comparePassword(password, user.hashed_password);

  if (!passwordMatches) {
    return res.status(401).json({
      message: "Authentication failed.",
    });
  }

  global.user_id = user.id;

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
