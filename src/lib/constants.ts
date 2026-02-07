export const APP_NAME = 'Spark';

export const LIMITS = {
  MAX_PHOTOS: 6,
  MIN_PHOTOS: 2,
  MAX_PROMPTS: 3,
  MAX_BIO_LENGTH: 500,
  MAX_PROMPT_ANSWER_LENGTH: 250,
  MAX_COMMENT_LENGTH: 200,
  DAILY_LIKES_FREE: 10,
  MATCH_EXPIRY_HOURS: 72,
} as const;

export const PROMPT_OPTIONS = [
  "A life goal of mine",
  "My simple pleasures",
  "The way to win me over is",
  "I'm looking for",
  "Dating me is like",
  "My most irrational fear",
  "I geek out on",
  "Typical Sunday",
  "The key to my heart is",
  "I'm convinced that",
  "My greatest strength",
  "I'll know it's time to delete this app when",
  "Together, we could",
  "I'm weirdly attracted to",
  "The one thing I'd love to know about you is",
  "Believe it or not, I",
  "We're the same type of weird if",
  "I recently discovered that",
  "Two truths and a lie",
  "The most spontaneous thing I've done",
  "I'll pick the topic if you start the convo",
  "My love language is",
  "I want someone who",
  "This year, I really want to",
  "Give me travel tips for",
  "Let's debate this topic",
  "I'm the type of texter who",
  "The hallmark of a good relationship is",
  "I'll fall for you if",
  "Change my mind about",
] as const;

export const GENDER_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'nonbinary', label: 'Non-binary' },
] as const;

export const LOOKING_FOR_OPTIONS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'everyone', label: 'Everyone' },
] as const;
