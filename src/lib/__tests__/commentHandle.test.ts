import { describe, expect, test } from "bun:test";
import { commentDisplayName, handleValidationError, needsCommentHandle } from "../commentHandle";

describe("needsCommentHandle", () => {
  test("placeholder usernames from sign-up need a real handle", () => {
    expect(needsCommentHandle({ username: "glow_ab12cd", username_generated: true })).toBe(true);
  });

  test("missing username (e.g. older Google sign-ups) needs a handle", () => {
    expect(needsCommentHandle({ username: null, username_generated: false })).toBe(true);
    expect(needsCommentHandle({ username: "  ", username_generated: false })).toBe(true);
    expect(needsCommentHandle(null)).toBe(true);
  });

  test("a chosen username is used as-is, so the prompt appears only once", () => {
    expect(needsCommentHandle({ username: "glowseeker", username_generated: false })).toBe(false);
    expect(commentDisplayName({ username: "glowseeker", username_generated: false })).toBe("glowseeker");
    expect(commentDisplayName({ username: "glow_ab12cd", username_generated: true })).toBeNull();
  });
});

describe("handleValidationError", () => {
  test("accepts the same shape as is_username_available()", () => {
    expect(handleValidationError("thandi_za")).toBeNull();
    expect(handleValidationError("  Lerato99 ")).toBeNull();
  });

  test("rejects bad shapes", () => {
    expect(handleValidationError("")).not.toBeNull();
    expect(handleValidationError("ab")).not.toBeNull();
    expect(handleValidationError("has space")).not.toBeNull();
    expect(handleValidationError("x".repeat(21))).not.toBeNull();
  });

  test("glow_ handles are reserved for placeholders", () => {
    expect(handleValidationError("glow_mine")).not.toBeNull();
  });
});
