const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_BASE = "http://localhost:3001/api/v1";

async function waitForHealth(base, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.status === 200) {
        return true;
      }
    } catch {
      // Ignore connection errors while waiting for startup.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function killChild(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
      killer.on("error", () => resolve());
      killer.on("exit", () => resolve());
    });
    return;
  }

  child.kill("SIGTERM");
}

async function ensureLocalApi(options = {}) {
  const base = options.base ?? DEFAULT_BASE;
  const cwd = options.cwd;
  const port = String(options.port ?? 3001);
  const timeoutMs = options.timeoutMs ?? 35000;

  const alreadyHealthy = await waitForHealth(base, 1500);
  if (alreadyHealthy) {
    return async () => {};
  }

  if (!cwd) {
    throw new Error("ensureLocalApi requires `cwd` when API is not running");
  }

  const distCandidates = [
    path.join(cwd, "dist", "main.js"),
    path.join(cwd, "dist", "src", "main.js"),
  ];
  const distEntry = distCandidates.find((item) => fs.existsSync(item));

  const child = distEntry
    ? spawn(process.execPath, [distEntry], {
        cwd,
        env: {
          ...process.env,
          PORT: port,
        },
        stdio: "ignore",
      })
    : spawn("cmd.exe", ["/d", "/s", "/c", "npm run start"], {
        cwd,
        env: {
          ...process.env,
          PORT: port,
        },
        stdio: "ignore",
      });

  const healthy = await waitForHealth(base, timeoutMs);
  if (!healthy) {
    await killChild(child);
    throw new Error(
      `Local API did not become healthy at ${base}/health within ${timeoutMs}ms`,
    );
  }

  return async () => {
    await killChild(child);
  };
}

module.exports = {
  ensureLocalApi,
};
