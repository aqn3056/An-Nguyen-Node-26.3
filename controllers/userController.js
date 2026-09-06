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

  value.hashedPassword = await hashPassword(value.password);
  delete value.password;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: value,
        select: { id: true, email: true, name: true },
      });

      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];
      await tx.task.createMany({ data: welcomeTaskData });

      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return { user: newUser, welcomeTasks };
    });

    global.user_id = Number(result.user.id);

    res.status(201).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email already registered" });
    }
    return next(err);
  }
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
