import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '../../../../src/features/messaging/components';
import { colors } from '../../../../src/theme/colors';

export default function ChatRoute() {
  const params = useLocalSearchParams<{
    matchId: string;
    userId: string;
    name: string;
    photo: string;
    expiresAt: string;
    hasMessages: string;
  }>();

  const { matchId, userId, name, photo, expiresAt, hasMessages } = params;

  if (!matchId || !userId) {
    return (
      <View style={styles.container}>
        <View style={styles.error}>
          <Text style={{ color: colors.textSecondary }}>Unable to load chat</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ChatScreen
        matchId={matchId}
        userId={userId}
        name={name || 'Unknown'}
        photoUrl={photo}
        expiresAt={expiresAt || undefined}
        hasMessages={hasMessages === '1'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
