const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.get("/", taskController.index);
router.post("/", taskController.create);
router.get("/:id", taskController.show);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
