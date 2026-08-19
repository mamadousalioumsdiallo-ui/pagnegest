import { Platform, type TextStyle } from 'react-native';

export const colors = {
  cream: '#F3EBE0',
  creamDark: '#E6D8C5',
  paper: '#FFFCF7',
  ink: '#1A120D',
  inkSoft: '#6E5A4B',
  line: '#E2D3BF',
  goldLine: '#D4B978',
  burgundy: '#6E1C16',
  burgundyDark: '#4C110E',
  gold: '#C4A35A',
  goldSoft: '#EAD9B0',
  goldDeep: '#8C6A1F',
  forest: '#1B3C32',
  forestSoft: '#D7E6DF',
  sky: '#3A4F68',
  rose: '#A45D6A',
  danger: '#A61B12',
  dangerSoft: '#F6E3E0',
  warning: '#A35A0A',
  warningSoft: '#F7E6CF',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
};

export const fonts = {
  display: Platform.select({
    web: 'Fraunces',
    ios: 'Georgia',
    default: 'serif',
  }) as string,
  body: Platform.select({
    web: 'Outfit',
    ios: 'System',
    default: 'sans-serif',
  }) as string,
};

export const type = {
  kicker: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: colors.goldDeep,
  } as TextStyle,
  display: {
    fontFamily: fonts.display,
    fontSize: 34,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.6,
  } as TextStyle,
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '600',
    color: colors.ink,
  } as TextStyle,
  section: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  } as TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '400',
    color: colors.ink,
  } as TextStyle,
  muted: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '400',
    color: colors.inkSoft,
    lineHeight: 18,
  } as TextStyle,
  money: {
    fontFamily: fonts.body,
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  } as TextStyle,
  label: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  } as TextStyle,
};

export const shadow = {
  card: {
    shadowColor: '#1A120D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  float: {
    shadowColor: '#4C110E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
};
