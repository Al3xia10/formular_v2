function toIsoOrNull(value) {
  const parsed = new Date(value || "");
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeObservationItem(item, index = 0) {
  const content = String(item?.content || item?.text || "").trim();

  if (!content) {
    return null;
  }

  const createdAt = toIsoOrNull(item?.createdAt) || null;
  const updatedAt = toIsoOrNull(item?.updatedAt) || createdAt;

  return {
    id: String(item?.id || `legacy-${index}`),
    content,
    createdAt,
    updatedAt,
  };
}

export function parseStudentObservations(rawValue) {
  const rawText = String(rawValue || "").trim();

  if (!rawText) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawText);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid observation payload");
    }

    return parsed
      .map((item, index) => normalizeObservationItem(item, index))
      .filter(Boolean);
  } catch {
    return [
      {
        id: "legacy-0",
        content: rawText,
        createdAt: null,
        updatedAt: null,
      },
    ];
  }
}

export function serializeStudentObservations(observations) {
  const normalized = (observations || [])
    .map((item, index) => normalizeObservationItem(item, index))
    .filter(Boolean);

  if (!normalized.length) {
    return null;
  }

  return JSON.stringify(normalized);
}

export function summarizeStudentObservations(observations) {
  if (!observations?.length) {
    return "";
  }

  return observations[0]?.content || "";
}
