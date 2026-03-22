const { execSync } = require("node:child_process");

const base = "http://localhost:3001/api/v1";
const password = "pass1234";

async function register(email) {
  const response = await fetch(`${base}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.status;
}

async function main() {
  const stamp = Date.now();
  const adminEmail = `ui-admin-${stamp}@test.com`;
  const instructorEmail = `ui-instructor-${stamp}@test.com`;

  console.log("REGISTER_ADMIN_STATUS", await register(adminEmail));
  console.log("REGISTER_INSTRUCTOR_STATUS", await register(instructorEmail));

  execSync(
    `docker exec learnaibot-postgres psql -U postgres -d learnaibot -c "UPDATE \\"User\\" SET role='ADMIN' WHERE email='${adminEmail}'; UPDATE \\"User\\" SET role='INSTRUCTOR' WHERE email='${instructorEmail}';"`,
    { stdio: "inherit" },
  );

  console.log("ADMIN_EMAIL", adminEmail);
  console.log("INSTRUCTOR_EMAIL", instructorEmail);
  console.log("PASSWORD", password);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
