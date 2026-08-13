import { describe, it, expect } from "vitest";
import { analyzeResumeAgainstJob } from "../lib/resumeAgent";

describe("analyzeResumeAgainstJob", () => {
  it("returns keyword coverage and targeted suggestions", () => {
    const result = analyzeResumeAgainstJob(
      "Built scalable Node.js APIs on AWS and mentored a small backend team.",
      "Senior backend engineer with Node.js, TypeScript, and AWS experience"
    );

    expect(result.keywordCoverage).toBeGreaterThan(0);
    expect(result.matchedKeywords).toContain("node");
    expect(result.matchedKeywords).toContain("aws");
    expect(result.missingKeywords).toContain("typescript");
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("handles empty inputs gracefully", () => {
    const result = analyzeResumeAgainstJob("", "");

    expect(result.summary).toContain("No clear job target");
    expect(result.matchedKeywords).toEqual([]);
    expect(result.missingKeywords).toEqual([]);
    expect(result.keywordCoverage).toBe(0);
  });
});
