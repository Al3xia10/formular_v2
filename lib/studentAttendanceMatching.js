export function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenizeName(value) {
  return normalizeName(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function buildScopedKey(nameKey, studyYear, groupCode) {
  return `${nameKey}::${studyYear}::${groupCode}`;
}

export function buildExactStudentKey({ fullName, studyYear, groupCode }) {
  return buildScopedKey(normalizeName(fullName), studyYear, groupCode);
}

export function buildLooseStudentKey({ fullName, studyYear, groupCode }) {
  const significantTokens = tokenizeName(fullName)
    .filter((token) => token.length > 1)
    .sort((left, right) => left.localeCompare(right));

  return buildScopedKey(significantTokens.join(" "), studyYear, groupCode);
}
