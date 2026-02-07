import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { springs, timing } from '../../theme/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  show: (
    message: string,
    options?: {
      variant?: ToastVariant;
      duration?: number;
      action?: ToastConfig['action'];
    }
  ) => void;
  hide: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (
      message: string,
      options?: {
        variant?: ToastVariant;
        duration?: number;
        action?: ToastConfig['action'];
      }
    ) => {
      const id = Math.random().toString(36).slice(2);
      const toast: ToastConfig = {
        id,
        message,
        variant: options?.variant || 'default',
        duration: options?.duration || 3000,
        action: options?.action,
      };

      setToasts((prev) => [...prev, toast]);
      Haptics.notificationAsync(
        toast.variant === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : toast.variant === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );

      setTimeout(() => {
        hide(id);
      }, toast.duration);
    },
    []
  );

  const hide = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      <View style={[styles.container, { top: insets.top + spacing.sm }]}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => hide(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: ToastConfig;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const variantStyles = getVariantStyles(toast.variant);

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(15).stiffness(150)}
      exiting={SlideOutUp.springify().damping(15).stiffness(150)}
      style={[styles.toast, variantStyles.container]}
    >
      <View style={styles.content}>
        <Text style={[styles.message, variantStyles.text]} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.action && (
          <Pressable
            onPress={() => {
              toast.action?.onPress();
              onDismiss();
            }}
            style={styles.actionButton}
          >
            <Text style={[styles.actionText, variantStyles.actionText]}>
              {toast.action.label}
            </Text>
          </Pressable>
        )}
      </View>
      <Pressable onPress={onDismiss} style={styles.dismissButton}>
        <Text style={variantStyles.dismissText}>×</Text>
      </Pressable>
    </Animated.View>
  );
}

interface VariantStyles {
  container: object;
  text: object;
  actionText: object;
  dismissText: object;
}

function getVariantStyles(variant: ToastVariant): VariantStyles {
  const variants: Record<ToastVariant, VariantStyles> = {
    default: {
      container: { backgroundColor: colors.charcoal },
      text: { color: colors.textInverse },
      actionText: { color: colors.rose },
      dismissText: { color: colors.textInverse },
    },
    success: {
      container: { backgroundColor: colors.success },
      text: { color: colors.textInverse },
      actionText: { color: colors.textInverse },
      dismissText: { color: colors.textInverse },
    },
    error: {
      container: { backgroundColor: colors.error },
      text: { color: colors.textInverse },
      actionText: { color: colors.textInverse },
      dismissText: { color: colors.textInverse },
    },
    warning: {
      container: { backgroundColor: colors.warning },
      text: { color: colors.charcoal },
      actionText: { color: colors.charcoal },
      dismissText: { color: colors.charcoal },
    },
    info: {
      container: { backgroundColor: colors.info },
      text: { color: colors.textInverse },
      actionText: { color: colors.textInverse },
      dismissText: { color: colors.textInverse },
    },
  };

  return variants[variant];
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    gap: spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.lg,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  message: {
    ...typography.body,
    flex: 1,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    ...typography.label,
    fontWeight: '600',
  },
  dismissButton: {
    padding: spacing.sm,
  },
});
