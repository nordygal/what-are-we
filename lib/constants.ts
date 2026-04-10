export const Colors = {
  primary: '#cc5a4e',
  primaryDark: '#a03a34',
  gradientColors: ['#cc5a4e', '#b84840', '#a03a34', '#8c3230', '#742a24'] as const,
  cream: '#f4f1eb',
  sand: '#d6d0c5',
  warmWhite: '#faf9f6',
  dark: '#2d3436',
  white: '#ffffff',
  gray: '#8e8e93',
  frosted: 'rgba(255,255,255,0.14)',
  frostedBorder: 'rgba(255,255,255,0.10)',
  textOnGradient: '#f5e6e0',
  textOnGradientMuted: 'rgba(255,255,255,0.55)',
} as const;

export var AVATAR_COLORS: string[] = [
  '#8fa47e',
  '#a09470',
  '#9482a0',
  '#7e9484',
  '#a08282',
  '#708fa0',
  '#a0907e',
  '#829e82',
];

export function getAvatarColor(name: string): string {
  var sum = 0;
  for (var i = 0; i < name.length; i++) {
    sum = sum + name.charCodeAt(i);
  }
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

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
  { key: 'dont_know_yet', emoji: '🙈', label: "don't know yet" },
  { key: 'we_just_met', emoji: '😅', label: 'we just met' },
  { key: 'who_is_this', emoji: '😭', label: 'who is this?' },
];

export function getAnswerDisplay(key: AnswerKey): AnswerOption | undefined {
  return ANSWER_OPTIONS.find(function (o) { return o.key === key; });
}
