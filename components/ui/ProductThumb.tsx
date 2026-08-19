import { artForCategory } from '@/lib/productArt';
import { colors, radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

export function ProductThumb({
  category,
  imageUri,
  size = 52,
  style,
}: {
  category: string;
  imageUri?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle | ViewStyle>;
}) {
  const art = artForCategory(category);
  const radiusValue = size >= 48 ? radius.md : radius.sm;

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: radiusValue,
            backgroundColor: colors.creamDark,
          },
          style as ImageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radiusValue,
          backgroundColor: art.gradient[0],
        },
        style,
      ]}>
      <View style={[styles.shine, { backgroundColor: art.gradient[1], opacity: 0.45 }]} />
      <Ionicons name={art.icon} size={Math.round(size * 0.42)} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  shine: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: '70%',
    height: '70%',
    borderRadius: 999,
  },
});
