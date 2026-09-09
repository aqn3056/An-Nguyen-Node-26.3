const prisma = require("../db/prisma");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

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

  const userId = req.user.id;

  let task = null;

  try {
    task = await prisma.task.create({
      data: { ...value, userId },
      select: {
        title: true,
        isCompleted: true,
        id: true,
        priority: true,
        createdAt: true,
      },
    });
  } catch (e) {
    return next(e);
  }

  res.status(201).json(task);
}

async function index(req, res, next) {
  const userId = req.user.id;

  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const skip = (page - 1) * limit;

  const whereClause = { userId };

  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find,
      mode: "insensitive",
    };
  }

  let tasks = null;
  let totalTasks = 0;

  try {
    tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    totalTasks = await prisma.task.count({
      where: whereClause,
    });
  } catch (e) {
    return next(e);
  }

  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  res.status(200).json({ tasks, pagination });
}

async function show(req, res, next) {
  const userId = req.user.id;

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
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
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

  const userId = req.user.id;

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
      select: { title: true, isCompleted: true, id: true, priority: true },
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
  const userId = req.user.id;

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

async function bulkCreate(req, res, next) {
  if (!req.body) req.body = {};

  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  const userId = req.user.id;

  const validTasks = [];

  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  index,
  show,
  create,
  update,
  deleteTask,
  bulkCreate,
};
