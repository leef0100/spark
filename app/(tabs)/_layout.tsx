import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLikesCount } from '../../src/features/matching/hooks';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, layout } from '../../src/theme/spacing';

// Placeholder icons - in production, use a proper icon library
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconMap: Record<string, string> = {
    discover: '◇',
    likes: '♡',
    matches: '💬',
    profile: '○',
  };

  return (
    <Text
      style={[
        styles.icon,
        { color: focused ? colors.rose : colors.muted },
      ]}
    >
      {iconMap[name] || '○'}
    </Text>
  );
}

function TabIconWithBadge({
  name,
  focused,
  badge,
}: {
  name: string;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.iconWithBadge}>
      <TabIcon name={name} focused={focused} />
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { data: likesCount } = useLikesCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: layout.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: spacing.sm,
        },
        tabBarActiveTintColor: colors.rose,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => <TabIcon name="discover" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: 'Likes',
          tabBarIcon: ({ focused }) => (
            <TabIconWithBadge name="likes" focused={focused} badge={likesCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ focused }) => <TabIcon name="matches" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  iconWithBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.rose,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
});
