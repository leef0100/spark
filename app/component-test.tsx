import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Container } from '../src/components/layout/Container';
import { Spacer } from '../src/components/layout/Spacer';
import { Divider } from '../src/components/layout/Divider';
import { Button } from '../src/components/ui/Button';
import { TextInput } from '../src/components/ui/TextInput';
import { Card } from '../src/components/ui/Card';
import { Avatar } from '../src/components/ui/Avatar';
import { Badge } from '../src/components/ui/Badge';
import { Chip } from '../src/components/ui/Chip';
import { IconButton } from '../src/components/ui/IconButton';
import { ProgressBar, SegmentedProgressBar } from '../src/components/ui/ProgressBar';
import { useToast } from '../src/components/ui/Toast';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

export default function ComponentTestScreen() {
  const [inputValue, setInputValue] = useState('');
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const { show } = useToast();

  return (
    <Container safeAreaEdges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Component Test</Text>
        <Text style={styles.subtitle}>UI Component Library</Text>

        <Spacer size="xl" />

        {/* Buttons */}
        <Text style={styles.sectionTitle}>Buttons</Text>
        <Spacer size="md" />
        <Button title="Primary Button" onPress={() => show('Primary pressed!')} />
        <Spacer size="sm" />
        <Button title="Secondary Button" variant="secondary" onPress={() => {}} />
        <Spacer size="sm" />
        <Button title="Ghost Button" variant="ghost" onPress={() => {}} />
        <Spacer size="sm" />
        <Button title="Destructive" variant="destructive" onPress={() => {}} />
        <Spacer size="sm" />
        <Button title="Loading..." loading onPress={() => {}} />
        <Spacer size="sm" />
        <Button title="Disabled" disabled onPress={() => {}} />

        <Divider />

        {/* Text Input */}
        <Text style={styles.sectionTitle}>Text Input</Text>
        <Spacer size="md" />
        <TextInput
          label="Your Name"
          value={inputValue}
          onChangeText={setInputValue}
          hint="Enter your full name"
        />
        <Spacer size="md" />
        <TextInput
          label="Bio"
          value=""
          onChangeText={() => {}}
          multiline
          numberOfLines={4}
          maxLength={500}
          showCharacterCount
        />
        <Spacer size="md" />
        <TextInput
          label="With Error"
          value="Invalid input"
          onChangeText={() => {}}
          error="This field has an error"
        />

        <Divider />

        {/* Cards */}
        <Text style={styles.sectionTitle}>Cards</Text>
        <Spacer size="md" />
        <Card variant="elevated">
          <Text style={styles.cardText}>Elevated Card</Text>
        </Card>
        <Spacer size="md" />
        <Card variant="flat">
          <Text style={styles.cardText}>Flat Card</Text>
        </Card>
        <Spacer size="md" />
        <Card variant="outlined" onPress={() => show('Card pressed!')}>
          <Text style={styles.cardText}>Outlined Card (Pressable)</Text>
        </Card>

        <Divider />

        {/* Avatars */}
        <Text style={styles.sectionTitle}>Avatars</Text>
        <Spacer size="md" />
        <View style={styles.row}>
          <Avatar size="small" name="John Doe" />
          <Spacer size="sm" horizontal />
          <Avatar size="medium" name="Jane Smith" showOnlineIndicator isOnline />
          <Spacer size="sm" horizontal />
          <Avatar size="large" name="Alex" showOnlineIndicator />
          <Spacer size="sm" horizontal />
          <Avatar size="xlarge" name="User" />
        </View>

        <Divider />

        {/* Badges */}
        <Text style={styles.sectionTitle}>Badges</Text>
        <Spacer size="md" />
        <View style={styles.row}>
          <Badge count={5} />
          <Spacer size="sm" horizontal />
          <Badge count={99} />
          <Spacer size="sm" horizontal />
          <Badge count={150} />
          <Spacer size="sm" horizontal />
          <Badge dot variant="success" />
          <Spacer size="sm" horizontal />
          <Badge count={3} variant="error" />
        </View>

        <Divider />

        {/* Chips */}
        <Text style={styles.sectionTitle}>Chips</Text>
        <Spacer size="md" />
        <View style={styles.chipContainer}>
          {['Travel', 'Music', 'Food', 'Art', 'Sports'].map((label) => (
            <Chip
              key={label}
              label={label}
              selected={selectedChip === label}
              onPress={() => setSelectedChip(selectedChip === label ? null : label)}
              variant="outlined"
            />
          ))}
        </View>

        <Divider />

        {/* Progress Bars */}
        <Text style={styles.sectionTitle}>Progress Bars</Text>
        <Spacer size="md" />
        <ProgressBar progress={0.3} />
        <Spacer size="md" />
        <ProgressBar progress={0.6} variant="success" />
        <Spacer size="md" />
        <ProgressBar progress={0.9} variant="warning" />
        <Spacer size="md" />
        <SegmentedProgressBar currentStep={2} totalSteps={5} />

        <Divider />

        {/* Toasts */}
        <Text style={styles.sectionTitle}>Toasts</Text>
        <Spacer size="md" />
        <View style={styles.row}>
          <Button
            title="Success"
            size="small"
            onPress={() => show('Success message!', { variant: 'success' })}
          />
          <Spacer size="sm" horizontal />
          <Button
            title="Error"
            size="small"
            variant="destructive"
            onPress={() => show('Error message!', { variant: 'error' })}
          />
          <Spacer size="sm" horizontal />
          <Button
            title="Info"
            size="small"
            variant="secondary"
            onPress={() => show('Info message!', { variant: 'info' })}
          />
        </View>

        <Spacer size="xxl" />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  cardText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
