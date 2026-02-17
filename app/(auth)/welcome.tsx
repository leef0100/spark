import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { springs } from '../../src/theme/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logoScale = useSharedValue(1);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const handleLogoPress = () => {
    logoScale.value = withSpring(1.1, springs.bouncy, () => {
      logoScale.value = withSpring(1, springs.gentle);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/login');
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/login');
  };

  return (
    <LinearGradient
      colors={[colors.ivory, colors.cream, colors.ivory]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>
        {/* Logo */}
        <AnimatedPressable onPress={handleLogoPress}>
          <Animated.View
            entering={FadeIn.delay(200).duration(1000)}
            style={logoAnimatedStyle}
          >
            <Text style={styles.logo}>Spark</Text>
          </Animated.View>
        </AnimatedPressable>

        {/* Tagline */}
        <Animated.View entering={FadeInDown.delay(500).duration(800)}>
          <Text style={styles.tagline}>Conversations that count</Text>
        </Animated.View>

        {/* Decorative dots */}
        <Animated.View
          entering={FadeIn.delay(800).duration(600)}
          style={styles.decorativeContainer}
        >
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotAccent]} />
          <View style={styles.dot} />
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View
        entering={FadeInDown.delay(700).duration(600)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {/* Value props */}
        <View style={styles.valueProps}>
          <Text style={styles.valueProp}>Real connections, not endless swiping</Text>
        </View>

        {/* Sign up button */}
        <Button
          title="Get Started"
          size="large"
          fullWidth
          onPress={handleSignUp}
        />

        {/* Login link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Pressable onPress={handleLogin} hitSlop={8}>
            <Text style={styles.loginLink}>Log in</Text>
          </Pressable>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontFamily: 'Georgia',
    fontSize: 72,
    fontWeight: '700',
    color: colors.rose,
    letterSpacing: -2,
    textShadowColor: 'rgba(212, 98, 110, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  tagline: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  decorativeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.muted,
  },
  dotAccent: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.rose,
  },
  footer: {
    paddingHorizontal: spacing.lg,
  },
  valueProps: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  valueProp: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loginLink: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '600',
  },
  terms: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
