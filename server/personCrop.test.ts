import { describe, expect, it } from "vitest";
import { parseNormalizedSelection } from "./personCrop";

describe("group-photo person selection", () => {
  it("accepts a normalized selection inside the image bounds", () => {
    expect(parseNormalizedSelection("10,20,30,50")).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 50,
    });
  });

  it("rejects malformed or out-of-bounds selections", () => {
    expect(() => parseNormalizedSelection("10,20,30")).toThrow();
    expect(() => parseNormalizedSelection("80,20,30,50")).toThrow();
    expect(() => parseNormalizedSelection("0,0,0,50")).toThrow();
  });
});
