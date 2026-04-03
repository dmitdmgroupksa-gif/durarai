import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#Durar",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#Durar",
      rawTarget: "#Durar",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "Durar-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "Durar-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "Durar-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "Durar-bot",
      rawTarget: "Durar-bot",
    });
  });
});
