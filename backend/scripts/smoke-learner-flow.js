const assert = require("node:assert/strict");
const path = require("node:path");
const { ensureLocalApi } = require("./lib/local-api");
const { seedSmokeCourse } = require("./seed-smoke-course");

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
  await seedSmokeCourse();

  const t = Date.now();
  const email = `learner-${t}@test.com`;
  const password = "pass1234";

  let res = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  console.log("REGISTER", res.status);
  assert.equal(res.status, 201, "register must return 201");
  assert.ok(res.body.accessToken, "register must return access token");

  res = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  console.log("LOGIN", res.status);
  assert.equal(res.status, 201, "login must return 201");
  const accessToken = res.body.accessToken;
  assert.ok(accessToken, "login must return access token");

  res = await request("/courses");
  console.log("COURSES", res.status);
  assert.equal(res.status, 200, "courses must return 200");
  const catalog = Array.isArray(res.body.items) ? res.body.items : [];
  assert.ok(catalog.length > 0, "at least one published course must exist");

  let firstCourse = null;
  let firstLesson = null;
  for (const course of catalog) {
    const details = await request("/courses/" + course.id);
    if (details.status !== 200) {
      continue;
    }
    const candidateLesson = details.body.modules?.[0]?.lessons?.[0];
    if (candidateLesson?.id) {
      firstCourse = course;
      firstLesson = candidateLesson;
      break;
    }
  }
  assert.ok(firstCourse?.id, "at least one published course with lessons must exist");
  assert.ok(firstLesson?.id, "selected course must include at least one lesson");

  res = await request("/courses/" + firstCourse.id + "/enroll", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log("ENROLL", res.status);
  assert.equal(res.status, 201, "enroll must return 201");

  res = await request("/users/me/enrollments", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log("MY_ENROLLMENTS", res.status);
  assert.equal(res.status, 200, "my enrollments must return 200");
  const enrolled = Array.isArray(res.body)
    ? res.body.find((item) => item.course?.id === firstCourse.id)
    : null;
  assert.ok(enrolled, "enrollment list must contain enrolled course");

  res = await request("/courses/" + firstCourse.id);
  console.log("COURSE_DETAILS", res.status);
  assert.equal(res.status, 200, "course details must return 200");

  res = await request("/lessons/" + firstLesson.id, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log("LESSON", res.status);
  assert.equal(res.status, 200, "lesson fetch must return 200");

  res = await request("/lessons/" + firstLesson.id + "/progress", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      watchedDuration: 180,
      completed: true,
    }),
  });
  console.log("SAVE_PROGRESS", res.status);
  assert.equal(res.status, 200, "save progress must return 200");

  res = await request("/users/me/progress", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log("MY_PROGRESS", res.status);
  assert.equal(res.status, 200, "progress summary must return 200");
  assert.ok(Array.isArray(res.body), "progress summary must be an array");
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
