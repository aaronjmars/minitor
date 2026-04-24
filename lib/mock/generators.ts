import { nanoid } from "nanoid";
import type { FeedItem } from "@/lib/columns/types";

const X_AUTHORS: { name: string; handle: string }[] = [
  { name: "Elon Musk", handle: "elonmusk" },
  { name: "Paul Graham", handle: "paulg" },
  { name: "Dan Abramov", handle: "dan_abramov" },
  { name: "Vitalik Buterin", handle: "VitalikButerin" },
  { name: "Naval", handle: "naval" },
  { name: "Patrick Collison", handle: "patrickc" },
  { name: "Marc Andreessen", handle: "pmarca" },
  { name: "Shaan Puri", handle: "ShaanVP" },
  { name: "Guillermo Rauch", handle: "rauchg" },
  { name: "Sarah Tavel", handle: "sarahtavel" },
  { name: "Andrej Karpathy", handle: "karpathy" },
  { name: "Lenny Rachitsky", handle: "lennysan" },
  { name: "Sahil Lavingia", handle: "shl" },
  { name: "Jack Butcher", handle: "jackbutcher" },
  { name: "Julie Zhuo", handle: "joulee" },
];

const X_TEMPLATES: ((q: string) => string)[] = [
  (q) => `Hot take: ${q} is more important than people realize. Something meaningful is shifting here.`,
  (q) => `Spent the afternoon digging into ${q}. Three things stood out — writing them up tonight.`,
  (q) => `Honestly, ${q} might be the most underrated move of the quarter. Curious who else is watching.`,
  (q) => `New thread on ${q} incoming. Early signal > late consensus.`,
  (q) => `Every founder I talk to keeps bringing up ${q}. That's usually how you know.`,
  (q) => `The ${q} story is being told wrong. The real angle is way more interesting.`,
  (q) => `If you're building in or around ${q}, DMs are open. Want to compare notes.`,
  (q) => `${q} — finally something worth getting excited about this week.`,
  (q) => `Unpopular opinion on ${q}: the first-order effects are noise. Second-order is where the alpha is.`,
  (q) => `Three years from now the best case study in how ${q} played out will be obvious. Right now it isn't.`,
  (q) => `Weekend reading: everything I could find about ${q}. Recommendations welcome.`,
  (q) => `Watching ${q} is like watching a slow-motion product decision play out in public.`,
];

const REDDIT_AUTHORS = [
  "deep_seeker42",
  "mr_pancakes",
  "quietcoder",
  "optimistic_pessimist",
  "notmyrealhandle",
  "curious_george_42",
  "latenight_dev",
  "shower_thinker",
  "just_here_to_lurk",
  "bagel_enthusiast",
  "chaos_goblin",
  "the_grid_knight",
  "sleepless_in_seattle",
  "marginal_revolution",
  "reasonable_doubt",
];

const REDDIT_TITLE_TEMPLATES: ((sub: string) => string)[] = [
  (s) => `What's the single best resource you'd recommend for someone just getting into r/${s}?`,
  (s) => `I've been lurking in r/${s} for six months — here's what I finally learned`,
  (s) => `Unpopular opinion: most advice on r/${s} is outdated. Here's what actually works in 2026`,
  (s) => `Weekly discussion — what has r/${s} been working on this week?`,
  (s) => `TIL something about ${s} that completely changed how I think about this`,
  (s) => `Long time r/${s} reader, first time poster. Would appreciate honest feedback`,
  (s) => `How do you all deal with the ${s} learning curve? Feeling stuck`,
  (s) => `The ${s} community has been the most helpful I've found on Reddit. Here's my story`,
  (s) => `Question for r/${s}: is this the right sub for my situation, or should I look elsewhere?`,
  (s) => `Shipping a small ${s} project I've been quietly building for 4 months`,
  (s) => `Weekly roundup: best ${s} posts of the last 7 days`,
  (s) => `Hot take — r/${s} is at its best when we stop chasing hype and focus on fundamentals`,
];

function pick<T>(arr: T[], seed?: number): T {
  const i = seed === undefined ? Math.floor(Math.random() * arr.length) : seed % arr.length;
  return arr[i];
}

function avatarFor(handle: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(handle)}`;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateXMentions(query: string, count = 6): FeedItem[] {
  const safeQuery = (query || "your search").trim() || "your search";
  const items: FeedItem[] = [];
  for (let i = 0; i < count; i++) {
    const author = pick(X_AUTHORS);
    const template = pick(X_TEMPLATES);
    const createdAt = new Date(Date.now() - randomBetween(0, 1000 * 60 * 30) - i * 1000 * 45).toISOString();
    items.push({
      id: nanoid(),
      author: {
        name: author.name,
        handle: author.handle,
        avatarUrl: avatarFor(author.handle),
      },
      content: template(safeQuery),
      url: `https://x.com/${author.handle}/status/${nanoid(12)}`,
      createdAt,
      meta: {
        likes: randomBetween(2, 4200),
        retweets: randomBetween(0, 480),
        replies: randomBetween(0, 120),
        views: randomBetween(100, 92000),
      },
    });
  }
  return items;
}

export function generateRedditPosts(subreddit: string, sortBy: string, count = 6): FeedItem[] {
  const safeSub = (subreddit || "popular").trim().replace(/^r\//, "") || "popular";
  const items: FeedItem[] = [];
  for (let i = 0; i < count; i++) {
    const author = pick(REDDIT_AUTHORS);
    const template = pick(REDDIT_TITLE_TEMPLATES);
    const createdAt = new Date(Date.now() - randomBetween(0, 1000 * 60 * 60) - i * 1000 * 90).toISOString();
    items.push({
      id: nanoid(),
      author: {
        name: author,
        handle: author,
        avatarUrl: avatarFor(author),
      },
      content: template(safeSub),
      url: `https://reddit.com/r/${safeSub}/comments/${nanoid(8)}`,
      createdAt,
      meta: {
        subreddit: safeSub,
        score: randomBetween(-10, 12400),
        comments: randomBetween(0, 820),
        sortBy,
      },
    });
  }
  return items;
}
