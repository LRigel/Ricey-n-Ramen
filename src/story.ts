import type { ThemeId } from './art/themes';

export type Speaker = 'Ricey' | 'Ramen' | 'Nien-Nien' | '';

export interface Line {
  who: Speaker;
  text: string;
  zh?: string; // Traditional Chinese
  /** Something that happens on screen when this line appears. */
  cue?: 'ticket' | 'flush' | 'door';
}

export interface Story {
  backdrop: ThemeId | 'sky';
  /** A sprite shown next to the pets for the whole scene. */
  prop?: string;
  lines: Line[];
}

export const STORIES: Record<string, Story> = {
  intro: {
    backdrop: 'house',
    prop: 'bowl',
    lines: [
      { who: '', text: 'A sunny morning in Australia...', zh: '澳洲一個陽光明媚的早晨……' },
      { who: 'Ramen', text: 'Breakfast time! Nien-Nien? NIEN-NIEN?!', zh: '早餐時間！Nien-Nien？NIEN-NIEN？！' },
      { who: 'Ricey', text: 'The bowl is empty. This is a crisis.', zh: '碗是空的。這是大危機。' },
      { who: 'Ramen', text: "Nien-Nien is GONE! We have to look everywhere!", zh: 'Nien-Nien 不見了！我們要到處找！' },
      { who: 'Ricey', text: "Fine. But I'm not running.", zh: '好吧。但我可不用跑的。' },
    ],
  },
  toBush: {
    backdrop: 'backyard',
    lines: [
      { who: 'Ramen', text: 'Not in the backyard... The scent goes out the gate!', zh: '後院沒有……味道往大門外去了！' },
      { who: 'Ricey', text: 'Into the bush, then. Watch out for magpies.', zh: '那就去叢林吧。小心喜鵲。' },
    ],
  },
  clue: {
    backdrop: 'bush',
    lines: [
      { who: 'Ramen', text: 'Sniff sniff... A ticket! It smells like Nien-Nien!', zh: '嗅嗅……一張機票！有 Nien-Nien 的味道！', cue: 'ticket' },
      { who: 'Ricey', text: 'It says... TAIPEI. That is in Taiwan.', zh: '上面寫著……台北。那是在台灣。' },
      { who: 'Ramen', text: "Then that's where we're going!", zh: '那我們就去那裡！' },
    ],
  },
  flyOut: {
    backdrop: 'sky',
    prop: 'plane',
    lines: [
      { who: '', text: 'Flying to Taiwan...', zh: '飛往台灣……' },
      { who: 'Ricey', text: 'Wake me up when we land.', zh: '降落了再叫我。' },
    ],
  },
  taiwan: {
    backdrop: 'market',
    lines: [
      { who: 'Ramen', text: 'Whoa! Look at all the FOOD!', zh: '哇！好多好吃的！' },
      { who: 'Ricey', text: "Focus. We're looking for Nien-Nien.", zh: '專心。我們是來找 Nien-Nien 的。' },
      { who: 'Ricey', text: '...After the dumplings.', zh: '……吃完小籠包再說。' },
    ],
  },
  uphill: {
    backdrop: 'jiufen',
    lines: [
      { who: 'Ramen', text: "Nien-Nien isn't at the market...", zh: 'Nien-Nien 不在夜市……' },
      { who: 'Ricey', text: "Let's head up the hill. You can see everything from up there.", zh: '我們上山吧。從上面什麼都看得到。' },
    ],
  },
  oops: {
    backdrop: 'jiufen',
    lines: [
      { who: 'Ramen', text: 'No Nien-Nien anywhere! But the bubble tea was nice.', zh: '到處都沒有 Nien-Nien！不過珍珠奶茶很好喝。' },
      { who: 'Ricey', text: 'Let me see that ticket again.', zh: '機票再給我看一下。', cue: 'ticket' },
      { who: 'Ricey', text: '...This ticket is from LAST YEAR.', zh: '……這張機票是去年的。' },
      { who: 'Ramen', text: '...Oops.', zh: '……糟糕。' },
      { who: 'Ricey', text: "We're going home.", zh: '我們回家。' },
    ],
  },
  flyHome: {
    backdrop: 'sky',
    prop: 'plane',
    lines: [{ who: '', text: 'Flying home to Australia...', zh: '飛回澳洲……' }],
  },
  home: {
    backdrop: 'house',
    lines: [
      { who: 'Ramen', text: "Home! But there's still no Nien-Nien...", zh: '到家了！可是還是沒有 Nien-Nien……' },
      { who: 'Ricey', text: 'Search every room. And mind the vacuum.', zh: '每個房間都找找。小心掃地機器人。' },
    ],
  },
  ending: {
    backdrop: 'house',
    prop: 'goal-door',
    lines: [
      { who: '', text: '*FLUSH*', zh: '*嘩啦——*', cue: 'flush' },
      { who: 'Nien-Nien', text: 'Oh, hi you two! Why are you so out of breath?', zh: '咦，你們兩個！怎麼喘成這樣？', cue: 'door' },
      { who: 'Ricey', text: 'You were in the BATHROOM?!', zh: '你一直在廁所裡？！' },
      { who: 'Ramen', text: 'We went to TAIWAN!', zh: '我們去了台灣耶！' },
      { who: 'Nien-Nien', text: 'Who wants dinner?', zh: '誰要吃晚餐？' },
      { who: 'Ramen', text: 'ME! ME! ME!', zh: '我！我！我！' },
      { who: 'Ricey', text: '...Me too.', zh: '……我也要。' },
    ],
  },
};

/** The whole game in order. Progress is saved as an index into this list. */
export type Step = { story: string } | { level: number };

export const FLOW: Step[] = [
  { story: 'intro' },
  { level: 0 },
  { story: 'toBush' },
  { level: 1 },
  { story: 'clue' },
  { story: 'flyOut' },
  { story: 'taiwan' },
  { level: 2 },
  { story: 'uphill' },
  { level: 3 },
  { story: 'oops' },
  { story: 'flyHome' },
  { story: 'home' },
  { level: 4 },
  { story: 'ending' },
];
