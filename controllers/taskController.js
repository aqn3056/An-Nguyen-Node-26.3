const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

let nextTaskId = 0;

function taskCounter() {
  nextTaskId += 1;
  return nextTaskId;
}

function sanitize(task) {
  const { userId, ...sanitizedTask } = task;
  return sanitizedTask;
}

async function create(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ message });
  }

  const newTask = { id: taskCounter(), userId: global.user_id.email, ...value };

  global.tasks.push(newTask);

  res.status(201).json(sanitize(newTask));
}

async function index(req, res) {
  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email,
  );

  if (userTasks.length === 0) {
    return res.status(404).json({ message: "No tasks found." });
  }

  res.status(200).json(userTasks.map((task) => sanitize(task)));
}

async function show(req, res) {
  const taskId = parseInt(req.params?.id);

  if (isNaN(taskId)) {
    return res.status(400).json({ message: "Invalid task id." });
  }

  const task = global.tasks.find(
    (t) => t.id === taskId && t.userId === global.user_id.email,
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  res.status(200).json(sanitize(task));
}

async function update(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ message });
  }

  const taskId = parseInt(req.params?.id);

  if (isNaN(taskId)) {
    return res.status(400).json({ message: "Invalid task id." });
  }

  const task = global.tasks.find(
    (t) => t.id === taskId && t.userId === global.user_id.email,
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  Object.assign(task, value);

  res.status(200).json(sanitize(task));
}

async function deleteTask(req, res) {
  const taskId = parseInt(req.params?.id);

  if (isNaN(taskId)) {
    return res.status(400).json({ message: "Invalid task id." });
  }

  const taskIndex = global.tasks.findIndex(
    (t) => t.id === taskId && t.userId === global.user_id.email,
  );

  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found." });
  }

  const deletedTask = sanitize(global.tasks[taskIndex]);

  global.tasks.splice(taskIndex, 1);

  res.status(200).json(deletedTask);
}

module.exports = {
  index,
  show,
  create,
  update,
  deleteTask,
};
