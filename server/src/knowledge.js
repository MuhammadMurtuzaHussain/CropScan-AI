// Crop knowledge base. The model may only *name* a condition from this list;
// the advice shown to the user comes from here, never from model free text.
// Disease names follow the PlantVillage label set used for the sample images.

export const CROPS = {
  apple: {
    name: 'Apple',
    conditions: {
      apple_scab: {
        cues: 'olive-green to dark brown, velvety or scabby patches on the leaf',
        name: 'Apple scab',
        keywords: ['scab', 'olive', 'dark', 'spot', 'lesion', 'velvety', 'scabby'],
        advice: [
          'Rake and remove fallen leaves in autumn; the fungus overwinters in them.',
          'Prune for airflow so foliage dries quickly after rain.',
          'Ask a local extension service which fungicide timing suits your region.',
        ],
      },
    },
  },
  corn: {
    name: 'Corn (maize)',
    conditions: {
      common_rust: {
        cues: 'small rusty orange-brown raised pustules scattered on both leaf surfaces',
        name: 'Common rust',
        keywords: ['rust', 'pustule', 'orange', 'brown', 'powder', 'raised', 'spot'],
        advice: [
          'Scout upper leaves; heavy early pustules justify a fungicide conversation with an advisor.',
          'Prefer resistant hybrids next season.',
        ],
      },
    },
  },
  grape: {
    name: 'Grape',
    conditions: {
      black_rot: {
        cues: 'round brown spots with dark margins, small black dots inside the spots',
        name: 'Black rot',
        keywords: ['black', 'rot', 'brown', 'spot', 'lesion', 'margin', 'dark'],
        advice: [
          'Remove mummified berries and infected leaves; they carry the fungus over winter.',
          'Open the canopy so leaves and fruit dry faster.',
          'A local viticulture advisor can time protective sprays for your area.',
        ],
      },
    },
  },
  pepper: {
    name: 'Bell pepper',
    conditions: {
      bacterial_spot: {
        cues: 'small dark water-soaked spots, often with yellow halos, may fall out leaving holes',
        name: 'Bacterial spot',
        keywords: ['spot', 'lesion', 'water', 'dark', 'brown', 'yellow', 'halo', 'speck'],
        advice: [
          'Avoid overhead watering and working among wet plants; the bacteria spread by splash and touch.',
          'Remove badly infected plants and rotate crops away from peppers and tomatoes.',
          'Use certified disease-free seed or transplants.',
        ],
      },
    },
  },
  potato: {
    name: 'Potato',
    conditions: {
      early_blight: {
        cues: 'brown spots with concentric rings like a target, often with yellowing around them',
        name: 'Early blight',
        keywords: ['concentric', 'ring', 'target', 'brown', 'spot', 'lesion', 'yellow', 'blight'],
        advice: [
          'Keep plants well fed and watered; stressed plants are hit harder.',
          'Remove badly affected lower leaves and rotate crops.',
          'An advisor can recommend a fungicide programme if pressure is high.',
        ],
      },
      late_blight: {
        cues: 'large irregular dark water-soaked blotches, may show white fuzzy growth underneath',
        name: 'Late blight',
        keywords: ['blight', 'water', 'dark', 'brown', 'black', 'lesion', 'white', 'mold', 'rot', 'spot'],
        advice: [
          'Treat as urgent: late blight spreads fast in cool, wet weather.',
          'Remove and bag infected plants; do not compost them.',
          'Contact local extension or an agronomist about protective sprays and tuber safety.',
        ],
      },
    },
  },
  tomato: {
    name: 'Tomato',
    conditions: {
      bacterial_spot: {
        cues: 'many small dark spots, some with yellow halos',
        name: 'Bacterial spot',
        keywords: ['spot', 'lesion', 'water', 'dark', 'brown', 'yellow', 'halo', 'speck'],
        advice: [
          'Avoid overhead watering and handling wet plants.',
          'Remove badly infected leaves and rotate crops.',
          'Use certified disease-free seed or transplants.',
        ],
      },
      early_blight: {
        cues: 'brown spots with concentric rings like a target, yellowing around them, older leaves first',
        name: 'Early blight',
        keywords: ['concentric', 'ring', 'target', 'brown', 'spot', 'lesion', 'yellow', 'blight'],
        advice: [
          'Mulch to stop soil splash and remove affected lower leaves.',
          'Stake or cage plants for airflow and rotate crops yearly.',
          'An advisor can suggest fungicide options if it keeps spreading.',
        ],
      },
      late_blight: {
        cues: 'large irregular dark brown or greasy-looking blotches, possibly white fuzz underneath',
        name: 'Late blight',
        keywords: ['blight', 'water', 'dark', 'brown', 'black', 'lesion', 'white', 'mold', 'rot', 'spot'],
        advice: [
          'Treat as urgent: late blight can destroy a crop within days in wet weather.',
          'Remove and bag infected plants; do not compost them.',
          'Contact local extension or an agronomist about protective sprays.',
        ],
      },
      leaf_mold: {
        cues: 'pale green or yellow patches on top, olive-grey velvety mould underneath',
        name: 'Leaf mold',
        keywords: ['mold', 'mould', 'yellow', 'olive', 'velvety', 'fuzzy', 'patch', 'underside', 'spot'],
        advice: [
          'Lower humidity: ventilate greenhouses and space plants for airflow.',
          'Water at the base and in the morning so leaves dry quickly.',
          'Remove affected leaves.',
        ],
      },
      septoria_leaf_spot: {
        cues: 'many small round spots with grey centres and dark borders',
        name: 'Septoria leaf spot',
        keywords: ['spot', 'small', 'circular', 'round', 'grey', 'gray', 'tan', 'dark', 'border', 'speck', 'lesion'],
        advice: [
          'Remove infected lower leaves and mulch to stop soil splash.',
          'Avoid overhead watering and rotate crops.',
          'An advisor can recommend fungicides if it keeps climbing the plant.',
        ],
      },
      yellow_leaf_curl_virus: {
        cues: 'leaves curled upward and cupped, small, with yellow edges, plant stunted',
        name: 'Tomato yellow leaf curl virus',
        keywords: ['curl', 'yellow', 'crumpl', 'stunt', 'small', 'cup', 'upward', 'pucker'],
        advice: [
          'The virus is spread by whiteflies; control them and use reflective mulch or netting.',
          'Remove and bag infected plants; there is no cure once infected.',
          'Choose resistant varieties next season.',
        ],
      },
    },
  },
};

// Words that describe a problem. A "healthy" verdict that cites these is suspect.
export const PROBLEM_WORDS = [
  'spot', 'lesion', 'blight', 'mold', 'mould', 'rust', 'pustule', 'curl', 'wilt',
  'rot', 'necro', 'chlor', 'yellowing', 'discolo', 'mildew', 'scab', 'hole', 'speck',
];

export const NEGATION = /\b(no|not|without|free of|absence of|absent|lacks?|none)\b/i;

export const DISCLAIMER =
  'This is an automated visual screen from an open-weight AI model, not agronomic advice. ' +
  'It can be wrong. Confirm with a local extension service or agronomist before acting, ' +
  'especially before spraying anything.';

export const GENERIC_UNCLEAR_ADVICE = [
  'Retake the photo in daylight, in focus, with a single leaf filling most of the frame.',
  'Photograph both sides of the leaf if you can.',
  'If the plant looks unwell, ask a local extension service or agronomist.',
];

/** Flat list of namespaced condition ids the model may choose from. */
export function conditionIds() {
  const ids = ['healthy', 'other_issue', 'unclear'];
  for (const [crop, c] of Object.entries(CROPS)) {
    for (const id of Object.keys(c.conditions)) ids.push(`${crop}.${id}`);
  }
  return ids;
}

export function cropIds() {
  return [...Object.keys(CROPS), 'other'];
}
