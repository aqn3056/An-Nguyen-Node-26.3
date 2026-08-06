const express = require("express");
const dogs = require("../dogData");
const { ValidationError, NotFoundError } = require("../errors");

const router = express.Router();

router.get("/dogs", (req, res) => {
  res.status(200).json(dogs);
});

router.post("/adopt", (req, res) => {
  const { name, address, email, dogName } = req.body;

  if (!name || !email || !dogName) {
    throw new ValidationError("Missing required fields: name, email, and dogName are required.");
  }

  const dog = dogs.find((d) => d.name === dogName);

  if (!dog || dog.status !== "available") {
    throw new NotFoundError(`Dog "${dogName}" not found or not available for adoption.`);
  }

  res.status(201).json({
    message: `Adoption request received. We will contact you at ${email} for further details.`,
    application: {
      name,
      address,
      email,
      dogName,
      applicationId: Date.now(),
    },
  });
});

router.get("/error", (req, res, next) => {
  next(new Error("Test error"));
});

module.exports = router;

