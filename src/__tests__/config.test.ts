import { describe, it, expect } from "vitest";
import { matchSpace } from "../config.js";

describe("matchSpace", () => {
  const spaces = ["Maple/Tasks", "BOA/Tasks", "CUB AI/Tasks"];

  it("returns exact match", () => expect(matchSpace(spaces, "Maple/Tasks")).toBe("Maple/Tasks"));
  it("returns partial match case-insensitively", () => expect(matchSpace(spaces, "maple")).toBe("Maple/Tasks"));
  it("returns undefined for no match", () => expect(matchSpace(spaces, "unknown")).toBeUndefined());
});
