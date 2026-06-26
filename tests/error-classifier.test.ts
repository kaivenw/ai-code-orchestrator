import { describe, it, expect } from "vitest";
import { classifyError, isFailoverableError } from "../src/core/errors.js";

describe("error-classifier", () => {
  it("detects quota errors", () => {
    expect(classifyError("Error: quota exceeded for this month")).toBe("quota");
    expect(classifyError("usage limit reached")).toBe("quota");
  });

  it("detects rate limit errors", () => {
    expect(classifyError("429 Too Many Requests")).toBe("rate_limit");
    expect(classifyError("rate limit hit")).toBe("rate_limit");
  });

  it("detects auth errors", () => {
    expect(classifyError("authentication failed: not logged in")).toBe("auth");
    expect(classifyError("invalid api key")).toBe("auth");
  });

  it("detects timeouts", () => {
    expect(classifyError("the request timed out")).toBe("timeout");
  });

  it("returns null for clean output", () => {
    expect(classifyError("everything is fine")).toBeNull();
    expect(classifyError("")).toBeNull();
  });

  it("prioritizes quota over timeout when both present", () => {
    expect(classifyError("usage limit reached and then it timed out")).toBe("quota");
  });

  it("marks failoverable error types", () => {
    expect(isFailoverableError("timeout")).toBe(true);
    expect(isFailoverableError("quota")).toBe(true);
    expect(isFailoverableError("rate_limit")).toBe(true);
    expect(isFailoverableError("parse_error")).toBe(false);
    expect(isFailoverableError(undefined)).toBe(false);
  });
});
