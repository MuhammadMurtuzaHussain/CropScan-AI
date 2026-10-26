import { CROPS, conditionIds, cropIds } from './knowledge.js';

// Passed to Ollama as `format` so decoding is constrained to this shape.
// Free-text fields come first on purpose: the model describes what it sees before
// it has to commit to enum values.
//
// With a crop supplied by the user the model only chooses among that crop's
// conditions. Without one it must also name the crop, which a small vision model
// does poorly on a lone leaf (see EVAL.md), so the app asks the user first.
export function responseSchema({ crop } = {}) {
  const given = crop && crop in CROPS;
  const props = {
    leaf_visible: { type: 'boolean' },
    ...(given ? {} : { plant: { type: 'string', maxLength: 40 } }),
    visible_signs: { type: 'array', items: { type: 'string', maxLength: 140 }, maxItems: 4 },
    ...(given ? {} : { crop: { type: 'string', enum: cropIds() } }),
    condition: {
      type: 'string',
      enum: given
        ? ['healthy', ...Object.keys(CROPS[crop].conditions).map((c) => `${crop}.${c}`), 'other_issue', 'unclear']
        : conditionIds(),
    },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  };
  return { type: 'object', properties: props, required: Object.keys(props), additionalProperties: false };
}

const COMMON = `Look only at what is visible. Do not guess beyond the image.

leaf_visible: true only if a leaf of a crop plant is clearly the subject. If the photo shows a background, soil, an object, or a person, set false.
visible_signs: up to 4 short phrases describing what you literally see (colour, spots, lesions, mould, curling). For a clean leaf say what looks normal, for example "uniform green, no spots".`;

export function buildPrompt({ crop } = {}) {
  if (crop && crop in CROPS) {
    const list = Object.entries(CROPS[crop].conditions)
      .map(([id, c]) => `- ${crop}.${id}: ${c.name}. ${c.cues}`)
      .join('\n');
    return `You are screening a photo of a ${CROPS[crop].name} leaf for visible signs of disease. The grower has told you the crop.
${COMMON}
condition: choose one.
- healthy: no signs of disease are visible.
${list}
- other_issue: use only if something is clearly wrong AND none of the diseases above is even a partial match. If the signs resemble one of the diseases above, choose that disease.
- unclear: the image is too poor to judge.
confidence: low, medium, or high, reflecting image quality and how clear the signs are. Use low when unsure.`;
  }
  return `You are screening a photo of a plant leaf for visible signs of disease.
${COMMON}
plant: your best guess at the plant species in plain words (for example "tomato", "apple tree", "maize").
crop: one of apple, corn, grape, pepper (bell pepper), potato, tomato; use "other" only if it is clearly none of these.
condition: "healthy" if no signs of disease are visible; otherwise the matching disease id for that crop (for example tomato.early_blight); "other_issue" if something is wrong but is not on the list; "unclear" if the image is too poor to judge.
confidence: low, medium, or high, reflecting image quality and how clear the signs are. Use low when unsure.`;
}
