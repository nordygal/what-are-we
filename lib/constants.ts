export const Colors = {
  primary: '#c4845c',
  primaryDark: '#8d5a38',
  gradientStart: '#c4845c',
  gradientEnd: '#a86d45',
  cream: '#f4f1eb',
  sand: '#d6d0c5',
  warmWhite: '#faf9f6',
  dark: '#2d3436',
  white: '#ffffff',
  gray: '#8e8e93',
  disabled: '#d1c7bc',
} as const;

export const Fonts = {
  brand: 'PlayfairDisplay',
  brandBold: 'PlayfairDisplay-Bold',
  ui: 'DMSans',
  uiMedium: 'DMSans-Medium',
  uiBold: 'DMSans-Bold',
} as const;

export type AnswerKey =
  | 'in_a_relationship'
  | 'exclusive'
  | 'seeing_other_people'
  | 'keeping_it_casual'
  | 'friends_with_benefits'
  | 'best_friends'
  | 'just_friends'
  | 'dont_know_yet'
  | 'we_just_met'
  | 'who_is_this';

export interface AnswerOption {
  key: AnswerKey;
  emoji: string;
  label: string;
}

export const ANSWER_OPTIONS: AnswerOption[] = [
  { key: 'in_a_relationship', emoji: '💕', label: 'in a relationship' },
  { key: 'exclusive', emoji: '🔒', label: 'exclusive' },
  { key: 'seeing_other_people', emoji: '👀', label: 'seeing other people' },
  { key: 'keeping_it_casual', emoji: '😏', label: 'keeping it casual' },
  { key: 'friends_with_benefits', emoji: '🔥', label: 'friends with benefits' },
  { key: 'best_friends', emoji: '🤝', label: 'best friends' },
  { key: 'just_friends', emoji: '✌️', label: 'just friends' },
  { key: 'dont_know_yet', emoji: '🤷', label: "don't know yet" },
  { key: 'we_just_met', emoji: '😅', label: 'we just met' },
  { key: 'who_is_this', emoji: '😭', label: 'who is this?' },
];

export function getAnswerDisplay(key: AnswerKey): AnswerOption | undefined {
  return ANSWER_OPTIONS.find(function (o) { return o.key === key; });
}
