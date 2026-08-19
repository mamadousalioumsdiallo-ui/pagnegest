import { Platform, type TextStyle } from 'react-native';

export const colors = {
  cream: '#FAF7F2',
  creamDark: '#EDE6DA',
  paper: '#FFFFFF',
  ink: '#1D3557',
  inkSoft: '#6B7280',
  line: '#E5DDD3',
  goldLine: '#D4A574',
  primary: '#1B4332',
  primaryLight: '#2D6A4F',
  primarySoft: '#D8F3DC',
  accent: '#D4A574',
  accentSoft: '#F5E6CE',
  accentDeep: '#9A6B2F',
  coral: '#E07A5F',
  coralSoft: '#FCEEEA',
  forest: '#40916C',
  forestSoft: '#D8F3DC',
  sky: '#457B9D',
  rose: '#C1666B',
  danger: '#C1121F',
  dangerSoft: '#FDECEC',
  warning: '#BC6C25',
  warningSoft: '#FEF3E8',
  white: '#FFFFFF',
  // aliases used across components
  burgundy: '#1B4332',
  burgundyDark: '#081C15',
  gold: '#D4A574',
  goldSoft: '#F5E6CE',
  goldDeep: '#9A6B2F',
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
    color: colors.accentDeep,
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
    shadowColor: '#1D3557',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  float: {
    shadowColor: '#081C15',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
};
