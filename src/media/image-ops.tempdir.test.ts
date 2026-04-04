import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolvePreferredDurarTmpDir } from "../infra/tmp-durar-dir.js";

describe("image-ops temp dir", () => {
  let createdTempDir = "";

  beforeEach(() => {
    process.env.Durar_IMAGE_BACKEND = "sips";
    const originalMkdtemp = fs.mkdtemp.bind(fs);
    vi.spyOn(fs, "mkdtemp").mockImplementation(async (prefix) => {
      createdTempDir = await originalMkdtemp(prefix);
      return createdTempDir;
    });
  });

  afterEach(() => {
    delete process.env.Durar_IMAGE_BACKEND;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("creates sips temp dirs under the secured Durar tmp root", async () => {
    const { getImageMetadata } = await import("./image-ops.js");
    const secureRoot = resolvePreferredDurarTmpDir();

    await getImageMetadata(Buffer.from("image"));

    expect(fs.mkdtemp).toHaveBeenCalledTimes(1);
    expect(fs.mkdtemp).toHaveBeenCalledWith(path.join(secureRoot, "Durar-img-"));
    expect(createdTempDir.startsWith(path.join(secureRoot, "Durar-img-"))).toBe(true);
    await expect(fs.access(createdTempDir)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
