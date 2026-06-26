import { describe, it, expect } from "vitest";
import {
  parseCheckpointFromOutput,
  buildPartialCheckpoint,
} from "../src/core/result-parser.js";

describe("result-parser", () => {
  it("extracts the last json code block", () => {
    const output = `
some thoughts
\`\`\`json
{ "task_id": "old", "step_id": "s1", "status": "partial", "summary": "first" }
\`\`\`
more work
\`\`\`json
{ "task_id": "t", "step_id": "s2", "status": "completed", "summary": "final" }
\`\`\`
`;
    const cp = parseCheckpointFromOutput(output);
    expect(cp?.summary).toBe("final");
    expect(cp?.status).toBe("completed");
  });

  it("falls back to the last bare json object", () => {
    const output = `done. {"task_id":"t","step_id":"s","status":"completed","summary":"bare"}`;
    const cp = parseCheckpointFromOutput(output);
    expect(cp?.summary).toBe("bare");
  });

  it("returns null when there is no parseable json", () => {
    expect(parseCheckpointFromOutput("no json here at all")).toBeNull();
    expect(parseCheckpointFromOutput("")).toBeNull();
  });

  it("ignores malformed json blocks", () => {
    const output = "```json\n{ not valid json }\n```";
    expect(parseCheckpointFromOutput(output)).toBeNull();
  });

  it("builds a partial checkpoint preserving context", () => {
    const cp = buildPartialCheckpoint({
      taskId: "t",
      stepId: "s",
      engine: "claude",
      rawOutputFile: "/logs/run.log",
    });
    expect(cp.status).toBe("partial");
    expect(cp.task_id).toBe("t");
    expect(cp.raw_output_file).toBe("/logs/run.log");
    expect(cp.known_issues.length).toBeGreaterThan(0);
  });
});
