#!/usr/bin/env node

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const hashFile = path.join(rootDir, "src", "canvas-host", "a2ui", ".bundle.hash");
const outputFile = path.join(rootDir, "src", "canvas-host", "a2ui", "a2ui.bundle.js");
const rendererDir = path.join(rootDir, "vendor", "a2ui", "renderers", "lit");
const appDir = path.join(rootDir, "apps", "shared", "DurarKit", "Tools", "CanvasA2UI");

const inputPaths = [
  path.join(rootDir, "package.json"),
  path.join(rootDir, "pnpm-lock.yaml"),
  rendererDir,
  appDir,
];

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const rolldownCandidates = [
  path.join(rootDir, "node_modules", ".pnpm", "node_modules", "rolldown", "bin", "cli.mjs"),
  path.join(rootDir, "node_modules", ".pnpm", "rolldown@1.0.0-rc.9", "node_modules", "rolldown", "bin", "cli.mjs"),
];

const normalizePath = (value) => value.split(path.sep).join("/");

const exists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const warnMissingBundle = () => {
  console.warn("A2UI sources missing; continuing without canvas A2UI bundle.");
};

const walkFiles = async (entryPath, files) => {
  const stats = await fs.stat(entryPath);
  if (stats.isDirectory()) {
    const entries = await fs.readdir(entryPath);
    for (const entry of entries) {
      await walkFiles(path.join(entryPath, entry), files);
    }
    return;
  }
  files.push(entryPath);
};

const computeHash = async () => {
  const files = [];
  for (const inputPath of inputPaths) {
    await walkFiles(inputPath, files);
  }

  files.sort((left, right) =>
    normalizePath(left).localeCompare(normalizePath(right)),
  );

  const hash = createHash("sha256");
  for (const filePath of files) {
    hash.update(normalizePath(path.relative(rootDir, filePath)));
    hash.update("\0");
    hash.update(await fs.readFile(filePath));
    hash.update("\0");
  }
  return hash.digest("hex");
};

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const useCmdWrapper = isWindows && command.toLowerCase().endsWith(".cmd");
    const spawnCommand = useCmdWrapper ? "cmd.exe" : command;
    const spawnArgs = useCmdWrapper ? ["/d", "/s", "/c", command, ...args] : args;
    const child = spawn(spawnCommand, spawnArgs, {
      cwd: rootDir,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });

const pickRolldownCommand = async () => {
  for (const candidate of rolldownCandidates) {
    if (await exists(candidate)) {
      return {
        command: process.execPath,
        args: [candidate, "-c", path.join(appDir, "rolldown.config.mjs")],
      };
    }
  }

  return {
    command: pnpmCommand,
    args: ["-s", "dlx", "rolldown", "-c", path.join(appDir, "rolldown.config.mjs")],
  };
};

const main = async () => {
  const hasRenderer = await exists(rendererDir);
  const hasApp = await exists(appDir);

  // Docker/source-minimized environments can reuse a prebuilt bundle.
  if (!hasRenderer || !hasApp) {
    if (await exists(outputFile)) {
      console.log("A2UI sources missing; keeping prebuilt bundle.");
      return;
    }
    warnMissingBundle();
    return;
  }

  const currentHash = await computeHash();
  if ((await exists(hashFile)) && (await exists(outputFile))) {
    const previousHash = (await fs.readFile(hashFile, "utf8")).trim();
    if (previousHash === currentHash) {
      console.log("A2UI bundle up to date; skipping.");
      return;
    }
  }

  await run(pnpmCommand, ["-s", "exec", "tsc", "-p", path.join(rendererDir, "tsconfig.json")]);
  const rolldown = await pickRolldownCommand();
  await run(rolldown.command, rolldown.args);
  await fs.writeFile(hashFile, `${currentHash}\n`, "utf8");
};

main().catch((error) => {
  console.error("A2UI bundling failed. Re-run with: pnpm canvas:a2ui:bundle");
  console.error("If this persists, verify pnpm deps and try again.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
