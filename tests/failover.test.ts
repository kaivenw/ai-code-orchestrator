import { describe, it, expect } from "vitest";
import { FailoverController } from "../src/core/failover.js";

function makeController(overrides = {}) {
  return new FailoverController({
    enabled: true,
    maxSwitchPerStep: 2,
    maxTotalSwitch: 5,
    ...overrides,
  });
}

describe("failover", () => {
  it("switches on a failoverable error when a fallback exists", () => {
    const c = makeController();
    const d = c.decide("step1", "timeout", true);
    expect(d.shouldSwitch).toBe(true);
  });

  it("does not switch without a fallback engine", () => {
    const c = makeController();
    expect(c.decide("step1", "timeout", false).shouldSwitch).toBe(false);
  });

  it("does not switch for non-failoverable errors", () => {
    const c = makeController();
    expect(c.decide("step1", "parse_error", true).shouldSwitch).toBe(false);
  });

  it("respects max switches per step", () => {
    const c = makeController({ maxSwitchPerStep: 1 });
    expect(c.decide("s", "timeout", true).shouldSwitch).toBe(true);
    c.recordSwitch("s");
    expect(c.decide("s", "timeout", true).shouldSwitch).toBe(false);
  });

  it("respects max total switches across steps", () => {
    const c = makeController({ maxSwitchPerStep: 5, maxTotalSwitch: 2 });
    c.recordSwitch("a");
    c.recordSwitch("b");
    expect(c.totalSwitchCount).toBe(2);
    expect(c.decide("c", "timeout", true).shouldSwitch).toBe(false);
  });

  it("does nothing when failover is disabled", () => {
    const c = makeController({ enabled: false });
    expect(c.decide("s", "timeout", true).shouldSwitch).toBe(false);
  });
});
