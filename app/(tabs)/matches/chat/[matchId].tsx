import { View, StyleSheet } from 'react-native';
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

  return (
    <View style={styles.container}>
      <ChatScreen
        matchId={matchId}
        userId={userId}
        name={name}
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
});
