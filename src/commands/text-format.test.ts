import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("Durar", 16)).toBe("Durar");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("Durar-status-output", 10)).toBe("Durar-…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
