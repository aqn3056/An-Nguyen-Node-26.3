const prisma = require("../db/prisma");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

function getCurrentUserId() {
  const userId = Number(global.user_id);
  if (!Number.isInteger(userId) || userId <= 0) return null;
  return userId;
}

function parseTaskId(param) {
  const taskId = Number(param);
  if (!Number.isInteger(taskId) || taskId <= 0) return null;
  return taskId;
}

async function create(req, res, next) {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ message });
  }

  const userId = getCurrentUserId();

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let task = null;

  try {
    task = await prisma.task.create({
      data: { ...value, userId },
      select: { title: true, isCompleted: true, id: true },
    });
  } catch (e) {
    return next(e);
  }

  res.status(201).json(task);
}

async function index(req, res, next) {
  const userId = getCurrentUserId();

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let tasks = null;

  try {
    tasks = await prisma.task.findMany({
      where: {
        userId,
      },
      select: { title: true, isCompleted: true, id: true },
    });
  } catch (e) {
    return next(e);
  }

  if (tasks.length === 0) {
    return res.status(404).json({ message: "No tasks found." });
  }

  res.status(200).json(tasks);
}

async function show(req, res, next) {
  const userId = getCurrentUserId();

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const taskId = parseTaskId(req.params?.id);

  if (!taskId) {
    return res.status(400).json({ message: "Invalid task id." });
  }

  let task = null;

  try {
    task = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId,
      },
      select: { title: true, isCompleted: true, id: true },
    });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ message: "Task not found." });
    }
    return next(e);
  }

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  res.status(200).json(task);
}

async function update(req, res, next) {
  if (!req.body) req.body = {};

  const userId = getCurrentUserId();

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const taskId = parseTaskId(req.params?.id);

  if (!taskId) {
    return res.status(400).json({ message: "Invalid task id." });
  }

  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ message });
  }

  let task = null;

  try {
    task = await prisma.task.update({
      data: value,
      where: {
        id: taskId,
        userId,
      },
      select: { title: true, isCompleted: true, id: true },
    });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ message: "Task not found." });
    }
    return next(e);
  }

  res.status(200).json(task);
}

async function deleteTask(req, res, next) {
  const userId = getCurrentUserId();

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const taskId = parseTaskId(req.params?.id);

  if (!taskId) {
    return res.status(400).json({ message: "Invalid task id." });
  }

  let task = null;

  try {
    task = await prisma.task.delete({
      where: {
        id: taskId,
        userId,
      },
      select: { title: true, isCompleted: true, id: true },
    });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ message: "Task not found." });
    }
    return next(e);
  }

  res.status(200).json(task);
}

module.exports = {
  index,
  show,
  create,
  update,
  deleteTask,
};
