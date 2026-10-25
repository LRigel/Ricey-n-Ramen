import type { ThemeId } from './art/themes';

export type Speaker = 'Ricey' | 'Ramen' | 'Nien-Nien' | 'Dudu' | '';

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
      { who: '', text: 'A sunny morning in Perth, Australia...', zh: '澳洲伯斯，一個陽光明媚的早晨……' },
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
      { who: 'Ricey', text: 'Then where IS Nien-Nien?', zh: '那 Nien-Nien 到底在哪裡？' },
      { who: 'Ramen', text: 'Up there! From the top of that mountain we can see EVERYTHING!', zh: '去那上面！從山頂上什麼都看得到！' },
    ],
  },
  dudu: {
    backdrop: 'taipei',
    prop: 'dudu',
    lines: [
      { who: '', text: 'At the top, a big orange cat is watching the city lights.', zh: '山頂上，有一隻胖胖的橘貓正看著城市的燈光。' },
      { who: 'Dudu', text: 'You two are a long way from home.', zh: '你們兩個離家很遠喔。' },
      { who: 'Ramen', text: 'We are looking for Nien-Nien! Have you seen Nien-Nien?', zh: '我們在找 Nien-Nien！你有看到 Nien-Nien 嗎？' },
      { who: 'Dudu', text: "Nien-Nien? Of course. I know everyone. I'm Dudu.", zh: 'Nien-Nien？當然囉，我誰都認識。我叫 Dudu。' },
      { who: 'Dudu', text: 'My human, Sunny, says Nien-Nien never left Perth.', zh: '我的主人 Sunny 說，Nien-Nien 根本沒離開伯斯。' },
      { who: 'Dudu', text: 'Go home, you silly things.', zh: '快回家吧，小傻瓜們。' },
      { who: 'Ricey', text: '...I knew it.', zh: '……我就知道。' },
      { who: 'Ramen', text: 'Thank you, Dudu! Say hi to Sunny!', zh: '謝謝你，Dudu！幫我們跟 Sunny 說嗨！' },
    ],
  },
  flyHome: {
    backdrop: 'sky',
    prop: 'plane',
    lines: [{ who: '', text: 'Flying home to Perth...', zh: '飛回伯斯……' }],
  },
  home: {
    backdrop: 'house',
    lines: [
      { who: 'Ramen', text: "Home! But there's still no Nien-Nien...", zh: '到家了！可是還是沒有 Nien-Nien……' },
      { who: 'Ricey', text: 'Dudu said Nien-Nien is here. Search every room.', zh: 'Dudu 說 Nien-Nien 就在這裡。每個房間都找找。' },
      { who: 'Ricey', text: 'And mind the vacuum.', zh: '還有，小心掃地機器人。' },
    ],
  },
  ending: {
    backdrop: 'house',
    prop: 'goal-door',
    lines: [
      { who: '', text: '*FLUSH*', zh: '*嘩啦——*', cue: 'flush' },
      { who: 'Nien-Nien', text: 'Oh, hi you two! Why are you so out of breath?', zh: '咦，你們兩個！怎麼喘成這樣？', cue: 'door' },
      { who: 'Ricey', text: 'You were in the BATHROOM?!', zh: '你一直在廁所裡？！' },
      { who: 'Ramen', text: 'We went to TAIWAN! We met DUDU!', zh: '我們去了台灣耶！還認識了 Dudu！' },
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
  { level: 4 },
  { story: 'dudu' },
  { story: 'flyHome' },
  { story: 'home' },
  { level: 5 },
  { story: 'ending' },
];
