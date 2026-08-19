import { colors } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

export function WaxMark({
  color = colors.gold,
  size = 7,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <View style={[styles.row, { gap: size * 0.85 }]} pointerEvents="none">
      {[0.28, 0.55, 1, 0.55, 0.28].map((opacity, index) => (
        <View
          key={index}
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            opacity,
            transform: [{ rotate: '45deg' }],
          }}
        />
      ))}
    </View>
  );
}

export function GoldRule() {
  return (
    <View style={styles.rule} pointerEvents="none">
      <View style={styles.ruleLine} />
      <View style={styles.ruleDiamond} />
      <View style={styles.ruleLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  ruleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.goldLine,
  },
  ruleDiamond: {
    width: 7,
    height: 7,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
  },
});
