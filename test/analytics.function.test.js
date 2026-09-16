require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
let agent;
const { app, server } = require("../app");

const manager = {
  name: "Mary Manager",
  email: "mmanager@example.com",
  password: "Pa$$word20",
};

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});

describe("manager-only analytics routes", () => {
  let saveRes = null;

  it("66. A user can be registered.", async () => {
    saveRes = await agent
      .post("/api/users/register")
      .set("X-Recaptcha-Test", process.env.RECAPTCHA_BYPASS)
      .send(manager);
    expect(saveRes.status).toBe(201);
  });

  it("67. A logged-on user without the manager role gets a 401 from /api/analytics/users.", async () => {
    saveRes = await agent.get("/api/analytics/users");
    expect(saveRes.status).toBe(401);
  });

  it("68. After the manager role is added, the user can log on again.", async () => {
    await prisma.user.update({
      where: { email: manager.email },
      data: { roles: "manager" },
    });
    saveRes = await agent
      .post("/api/users/logon")
      .send({ email: manager.email, password: manager.password });
    expect(saveRes.status).toBe(200);
  });

  it("69. The manager gets a 200 from /api/analytics/users.", async () => {
    saveRes = await agent.get("/api/analytics/users");
    expect(saveRes.status).toBe(200);
  });

  it("70. The manager response includes the list of users.", () => {
    expect(saveRes.body.users).toHaveLength(1);
  });
});
