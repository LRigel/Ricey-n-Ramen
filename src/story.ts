import type { ThemeId } from './art/themes';

export type Speaker = 'Ricey' | 'Ramen' | 'Nien-Nien' | '';

export interface Line {
  who: Speaker;
  text: string;
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
      { who: '', text: 'A sunny morning in Australia...' },
      { who: 'Ramen', text: 'Breakfast time! Nien-Nien? NIEN-NIEN?!' },
      { who: 'Ricey', text: 'The bowl is empty. This is a crisis.' },
      { who: 'Ramen', text: "Nien-Nien is GONE! We have to look everywhere!" },
      { who: 'Ricey', text: "Fine. But I'm not running." },
    ],
  },
  toBush: {
    backdrop: 'backyard',
    lines: [
      { who: 'Ramen', text: 'Not in the backyard... The scent goes out the gate!' },
      { who: 'Ricey', text: 'Into the bush, then. Watch out for magpies.' },
    ],
  },
  clue: {
    backdrop: 'bush',
    lines: [
      { who: 'Ramen', text: 'Sniff sniff... A ticket! It smells like Nien-Nien!', cue: 'ticket' },
      { who: 'Ricey', text: 'It says... TAIPEI. That is in Taiwan.' },
      { who: 'Ramen', text: "Then that's where we're going!" },
    ],
  },
  flyOut: {
    backdrop: 'sky',
    prop: 'plane',
    lines: [
      { who: '', text: 'Flying to Taiwan...' },
      { who: 'Ricey', text: 'Wake me up when we land.' },
    ],
  },
  taiwan: {
    backdrop: 'market',
    lines: [
      { who: 'Ramen', text: 'Whoa! Look at all the FOOD!' },
      { who: 'Ricey', text: "Focus. We're looking for Nien-Nien." },
      { who: 'Ricey', text: '...After the dumplings.' },
    ],
  },
  uphill: {
    backdrop: 'jiufen',
    lines: [
      { who: 'Ramen', text: "Nien-Nien isn't at the market..." },
      { who: 'Ricey', text: "Let's head up the hill. You can see everything from up there." },
    ],
  },
  oops: {
    backdrop: 'jiufen',
    lines: [
      { who: 'Ramen', text: 'No Nien-Nien anywhere! But the bubble tea was nice.' },
      { who: 'Ricey', text: 'Let me see that ticket again.', cue: 'ticket' },
      { who: 'Ricey', text: '...This ticket is from LAST YEAR.' },
      { who: 'Ramen', text: '...Oops.' },
      { who: 'Ricey', text: "We're going home." },
    ],
  },
  flyHome: {
    backdrop: 'sky',
    prop: 'plane',
    lines: [{ who: '', text: 'Flying home to Australia...' }],
  },
  home: {
    backdrop: 'house',
    lines: [
      { who: 'Ramen', text: "Home! But there's still no Nien-Nien..." },
      { who: 'Ricey', text: 'Search every room. And mind the vacuum.' },
    ],
  },
  ending: {
    backdrop: 'house',
    prop: 'goal-door',
    lines: [
      { who: '', text: '*FLUSH*', cue: 'flush' },
      { who: 'Nien-Nien', text: 'Oh, hi you two! Why are you so out of breath?', cue: 'door' },
      { who: 'Ricey', text: 'You were in the BATHROOM?!' },
      { who: 'Ramen', text: 'We went to TAIWAN!' },
      { who: 'Nien-Nien', text: 'Who wants dinner?' },
      { who: 'Ramen', text: 'ME! ME! ME!' },
      { who: 'Ricey', text: '...Me too.' },
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
