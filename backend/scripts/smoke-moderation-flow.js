require("dotenv/config");
const assert = require("node:assert/strict");
const path = require("node:path");
const { ensureLocalApi } = require("./lib/local-api");
const { createPrismaClient } = require("./lib/prisma-client");

const base = "http://localhost:3001/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  return { status: response.status, body };
}

async function main() {
  const prisma = createPrismaClient();
  try {
    const t = Date.now();
    const adminEmail = `admin${t}@test.com`;
    const instructorEmail = `instr${t}@test.com`;
    const password = "pass1234";

  let res = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password }),
  });
  console.log("REGISTER_ADMIN", res.status);
  assert.equal(res.status, 201, "admin registration must return 201");

  res = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: instructorEmail, password }),
  });
  console.log("REGISTER_INSTR", res.status);
  assert.equal(res.status, 201, "instructor registration must return 201");

  await prisma.user.update({
    where: { email: adminEmail },
    data: { role: "ADMIN" },
  });

  res = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password }),
  });
  const adminToken = res.body.accessToken;
  console.log("LOGIN_ADMIN", res.status, Boolean(adminToken));
  assert.equal(res.status, 201, "admin login must return 201");
  assert.ok(adminToken, "admin token must exist");

  res = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: instructorEmail, password }),
  });
  let instructorToken = res.body.accessToken;
  const instructorUserId = JSON.parse(
    Buffer.from(instructorToken.split(".")[1], "base64url").toString(),
  ).sub;
  console.log("LOGIN_INSTR", res.status, Boolean(instructorToken));
  assert.equal(res.status, 201, "instructor login must return 201");
  assert.ok(instructorToken, "instructor token must exist");
  assert.ok(instructorUserId, "instructor user id must exist");

  res = await request(`/admin/users/${instructorUserId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ role: "INSTRUCTOR" }),
  });
  console.log("PROMOTE_INSTR", res.status, res.body.role);
  assert.equal(res.status, 200, "promote instructor must return 200");
  assert.equal(res.body.role, "INSTRUCTOR", "role must be INSTRUCTOR");

  res = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: instructorEmail, password }),
  });
  instructorToken = res.body.accessToken;
  console.log("RELOGIN_INSTR", res.status);
  assert.equal(res.status, 201, "relogin instructor must return 201");
  assert.ok(instructorToken, "relogin instructor token must exist");

  const slug = `mod-course-${t}`;
  res = await request("/instructor/courses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instructorToken}`,
    },
    body: JSON.stringify({
      slug,
      title: `Moderation Flow ${t}`,
      description: "moderation smoke",
    }),
  });
  const courseId = res.body.id;
  console.log("CREATE_COURSE", res.status, courseId);
  assert.equal(res.status, 201, "create course must return 201");
  assert.ok(courseId, "course id must exist");

  res = await request(`/instructor/courses/${courseId}/modules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instructorToken}`,
    },
    body: JSON.stringify({ title: "Module 1", order: 1 }),
  });
  const moduleId = res.body.id;
  console.log("ADD_MODULE", res.status, moduleId);
  assert.equal(res.status, 201, "add module must return 201");
  assert.ok(moduleId, "module id must exist");

  res = await request(`/instructor/modules/${moduleId}/lessons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instructorToken}`,
    },
    body: JSON.stringify({
      title: "Lesson 1",
      type: "VIDEO",
      order: 1,
      contentUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    }),
  });
  console.log("ADD_LESSON", res.status, res.body.id);
  assert.equal(res.status, 201, "add lesson must return 201");
  assert.ok(res.body.id, "lesson id must exist");

  res = await request(`/instructor/courses/${courseId}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  console.log("PUBLISH", res.status, res.body.status);
  assert.equal(res.status, 201, "publish must return 201");
  assert.equal(res.body.status, "PUBLISHED", "published status expected");

  res = await request("/admin/courses/moderation", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const presentAfterPublish =
    Array.isArray(res.body) && res.body.some((course) => course.id === courseId);
  console.log("MOD_LIST_AFTER_PUBLISH", res.status, presentAfterPublish);
  assert.equal(res.status, 200, "moderation list must return 200");
  assert.equal(
    presentAfterPublish,
    true,
    "published course must appear in moderation list",
  );

  res = await request(`/admin/courses/${courseId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ reason: "Needs edits" }),
  });
  console.log("REJECT", res.status, res.body.status, res.body.moderationReason);
  assert.equal(res.status, 201, "reject must return 201");
  assert.equal(res.body.status, "DRAFT", "rejected course must become DRAFT");

  res = await request("/courses");
  const publicAfterReject =
    Array.isArray(res.body.items) && res.body.items.some((course) => course.id === courseId);
  console.log("PUBLIC_AFTER_REJECT", res.status, publicAfterReject);
  assert.equal(res.status, 200, "public courses list must return 200");
  assert.equal(publicAfterReject, false, "rejected course must be hidden");

  res = await request(`/admin/courses/${courseId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log("APPROVE", res.status, res.body.status);
  assert.equal(res.status, 201, "approve must return 201");
  assert.equal(res.body.status, "PUBLISHED", "approved course must be PUBLISHED");

  res = await request("/courses");
  const publicAfterApprove =
    Array.isArray(res.body.items) && res.body.items.some((course) => course.id === courseId);
  console.log("PUBLIC_AFTER_APPROVE", res.status, publicAfterApprove);
  assert.equal(res.status, 200, "public courses list must return 200");
  assert.equal(publicAfterApprove, true, "approved course must be visible");

  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const stopApi = await ensureLocalApi({
    base,
    cwd: path.resolve(__dirname, ".."),
    port: 3001,
  });

  try {
    await main();
  } finally {
    await stopApi();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
