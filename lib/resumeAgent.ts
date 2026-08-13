import { sanitizeInput } from "./aiUtils";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "the",
  "their",
  "this",
  "to",
  "with",
  "your",
]);

function normalizeText(text: string): string {
  return sanitizeInput(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter(Boolean)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function analyzeResumeAgainstJob(resumeText: string, jobDescription: string) {
  const safeResume = sanitizeInput(resumeText);
  const safeJob = sanitizeInput(jobDescription);

  if (!safeResume || !safeJob) {
    return {
      summary: "No clear job target or resume content was provided yet.",
      matchedKeywords: [],
      missingKeywords: [],
      suggestions: [
        "Add the target job title and a few resume details so the agent can compare them.",
      ],
      keywordCoverage: 0,
    };
  }

  const jobKeywords = extractKeywords(safeJob);
  const resumeKeywords = extractKeywords(safeResume);
  const matchedKeywords = jobKeywords.filter((keyword) => resumeKeywords.includes(keyword));
  const missingKeywords = jobKeywords.filter((keyword) => !resumeKeywords.includes(keyword));

  const summary = matchedKeywords.length > 0
    ? `The resume already reflects ${matchedKeywords.length} relevant keywords from the target role.`
    : "The resume does not yet show many keywords from the target role.";

  const suggestions = [
    matchedKeywords.length > 0
      ? `Emphasize your experience with ${matchedKeywords.slice(0, 3).join(", ")} in your summary and bullets.`
      : "Add concrete skills and tools that match the target role in your summary and experience sections.",
  ];

  if (missingKeywords.length > 0) {
    suggestions.push(
      `Include measurable examples that show ${missingKeywords.slice(0, 3).join(", ")} and your impact.`
    );
  }

  suggestions.push("Quantify achievements with metrics, outcomes, and tools used.");

  return {
    summary,
    matchedKeywords: Array.from(new Set(matchedKeywords)).slice(0, 8),
    missingKeywords: Array.from(new Set(missingKeywords)).slice(0, 8),
    suggestions,
    keywordCoverage: Math.round(
      (matchedKeywords.length / Math.max(1, jobKeywords.length)) * 100
    ),
  };
}
