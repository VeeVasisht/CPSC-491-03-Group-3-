import { describe, expect, it } from "vitest";
import { COMMENT_MAX_LENGTH, validateCommentInput } from "./comment";

describe("validateCommentInput", () => {
  it("rejects empty comments", () => {
    const res = validateCommentInput("");
    expect(res.valid).toBe(false);
    expect(res.error).toBe("Comment cannot be empty.");
  });

  it("rejects comments exceeding maximum length", () => {
    const longStr = "a".repeat(COMMENT_MAX_LENGTH + 1);
    const res = validateCommentInput(longStr);
    expect(res.valid).toBe(false);
    expect(res.error).toContain(`${COMMENT_MAX_LENGTH} characters`);
  });

  it("accepts valid comments", () => {
    const res = validateCommentInput("Great trip pictures!");
    expect(res.valid).toBe(true);
  });
});