// No photo: describing how someone looks (owner, 2026-11-08). Shared by Build
// My Card and Personalize a Template. After the open description, at most two
// follow-ups ask about key details it leaves out, in this order. The app picks
// the detail; Haiku may only reword it. We never guess a look from a name.

export type LookDetail = {
  id: "hair" | "style" | "signature";
  /** True when the customer's words already cover this detail. */
  covered: RegExp;
  heading: [string, string];
  /** The question, with the person's name (or "they"). */
  prompt: (name: string | null) => string;
  placeholder: string;
};

export const MAX_LOOK_FOLLOW_UPS = 2;

export const LOOK_DETAILS: LookDetail[] = [
  {
    id: "hair",
    covered: /\b(hair|bald|curl\w*|braid\w*|bun|ponytail|locs|dreads|fringe|bangs|afro|blond\w*|brunette|redhead|ginger|grey|gray|buzz ?cut|shaved head)\b/i,
    heading: ["Their", "hair"],
    prompt: (name) => (name ? `What’s ${name}’s hair like?` : "What’s their hair like?"),
    placeholder: "Short and curly, dark brown, a little grey at the sides.",
  },
  {
    id: "style",
    covered: /\b(wear\w*|dress\w*|shirt|t-shirt|tee|hoodie|jacket|coat|sweater|jumper|jeans|suit|outfit|uniform|style|clothes|overalls|cardigan|flannel)\b/i,
    heading: ["What they", "usually wear"],
    prompt: (name) => (name ? `What does ${name} usually wear?` : "What do they usually wear?"),
    placeholder: "Jeans, a flannel shirt and his old baseball cap.",
  },
  {
    id: "signature",
    covered: /\b(glasses|spectacles|cap|hat|beanie|scarf|earrings?|necklace|watch|beard|moustache|mustache|freckles|tattoo\w*|piercing\w*|always (?:has|carries)|never without|signature)\b/i,
    heading: ["Anything they’re", "known for?"],
    prompt: (name) => (name
      ? `Is there anything ${name} is never without, like glasses, a hat or a favourite accessory?`
      : "Is there anything they’re never without, like glasses, a hat or a favourite accessory?"),
    placeholder: "Round glasses and a coffee mug in hand.",
  },
];

export function lookDetail(id: string | null | undefined) {
  return LOOK_DETAILS.find((detail) => detail.id === id) || null;
}

/** Details still missing from everything the customer has said so far. */
export function missingDetails(said: string, alreadyAsked: string[] = []) {
  return LOOK_DETAILS.filter((detail) => !detail.covered.test(said) && !alreadyAsked.includes(detail.id));
}

// A heuristic for mock data mode; in production the interviewer can classify the description.
// Words for a person ("my mom", "a man", "me") always mean a person.
const PERSON_WORDS = /\b(man|men|woman|women|boy|girl|guy|lady|kid|child|children|baby|toddler|teen|mom|mum|mother|dad|father|parent|sister|brother|son|daughter|wife|husband|partner|girlfriend|boyfriend|fianc\w*|friend|grandma|grandmother|grandpa|grandfather|nana|papa|aunt|uncle|cousin|niece|nephew|boss|colleague|coworker|teacher|person|people|family|me|myself)\b/i;
// Pronouns (he, she, they…) no longer count on their own: "our cat Luna, she loves naps" is
// still a cat (fix, 2026-11-09). With no animal or thing named, the default below is a person anyway.

const ANIMALS = [
  // pets and breeds
  "dog", "pupp(?:y|ies)", "pup", "doggo", "cat", "kitten", "kitty", "pet", "parrot", "budgie", "hamster", "guinea pig", "ferret",
  "rabbit", "bunny", "bunnies", "goldfish", "turtle", "tortoise", "lizard", "gecko", "snake", "retriever", "labrador", "poodle",
  "terrier", "spaniel", "shepherd", "bulldog", "beagle", "husky", "huskies", "corgi", "dachshund", "chihuahua", "pug", "collie",
  "doodle", "schnauzer", "greyhound", "tabby",
  // general words
  "animal", "creature", "critter", "beast", "wildlife", "bird", "fish", "insect", "bug",
  // wild, farm and sea animals (the fox bug: anything unlisted counted as a person)
  "fox(?:es)?", "wol(?:f|ves)", "bear", "deer", "moose", "elk", "raccoon", "squirrel", "chipmunk", "beaver", "otter", "skunk",
  "hedgehog", "porcupine", "badger", "owl", "eagle", "hawk", "falcon", "robin", "sparrow", "cardinal", "bluebird", "hummingbird",
  "crow", "raven", "penguin", "puffin", "flamingo", "peacock", "duck", "duckling", "goose", "geese", "swan", "chicken", "chick",
  "hen", "rooster", "turkey", "cow", "calf", "calves", "bull", "pig", "piglet", "sheep", "lamb", "goat", "donkey", "llama",
  "alpaca", "horse", "pony", "ponies", "foal", "lion", "tiger", "leopard", "cheetah", "jaguar", "panther", "elephant", "giraffe",
  "zebra", "hippo", "rhino", "monkey", "gorilla", "chimp", "orangutan", "panda", "koala", "kangaroo", "sloth", "lemur",
  "frog", "toad", "bee", "butterfly", "butterflies", "ladybug", "dragonfly", "dragonflies", "caterpillar", "snail",
  "whale", "dolphin", "shark", "octopus", "octopi", "seal", "walrus", "crab", "lobster", "jellyfish", "starfish", "seahorse",
  "mouse", "mice", "rat", "bat",
  // made-up creatures
  "dinosaur", "dragon", "unicorn", "mermaid", "monster", "robot", "alien", "gnome", "yeti",
];
const THINGS = [
  "car", "truck", "train", "plane", "boat", "bike", "house", "home", "cabin", "garden", "cake", "cupcake", "flower", "bouquet",
  "rose", "sunflower", "tree", "forest", "leaf", "leaves", "landscape", "beach", "mountain", "lake", "ocean", "sea", "river",
  "sky", "sunset", "sunrise", "moon", "star", "city", "skyline", "pattern", "balloon", "confetti", "gift", "coffee", "teacup",
  "book", "heart", "rainbow", "snowflake", "pumpkin", "candle",
];
// Each word also matches a plain plural ("foxes", "bears", "trees").
const ANIMAL_OR_THING_WORDS = new RegExp(`\\b(?:${[...ANIMALS, ...THINGS].join("|")})(?:e?s)?\\b`, "i");

/**
 * Whether a no-photo description is about a person (so hair and clothes make
 * sense). Words for people win ("my mom and her dog"). Otherwise an animal,
 * creature or thing means it isn't ("our dog Biscuit", "a fox in a scarf",
 * "a vintage car"), even with "she" or "he". Anything else (often just a name
 * and a look) is treated as a person.
 */
export function describesAPerson(text: string | null | undefined) {
  const value = (text || "").trim();
  if (!value) return false;
  if (PERSON_WORDS.test(value)) return true;
  if (ANIMAL_OR_THING_WORDS.test(value)) return false;
  return true;
}
