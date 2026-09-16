const express = require("express");
const { StatusCodes } = require("http-status-codes");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

const managerOnly = (req, res, next) => {
  const roles = req.user?.roles?.split(",").map((role) => role.trim()) ?? [];
  if (!roles.includes("manager")) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Manager role required." });
  }
  next();
};

router.use(managerOnly);

router.get("/users/:id", analyticsController.getUserAnalytics);
router.get("/users", analyticsController.getUsersWithStats);
router.get("/tasks/search", analyticsController.searchTasks);

module.exports = router;
