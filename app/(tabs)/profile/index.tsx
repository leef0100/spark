import React from 'react';
import { ProfileView } from '../../../src/features/profile/components/ProfileView';
import { ProfileSkeleton } from '../../../src/features/profile/components/ProfileSkeleton';
import { useMyProfile } from '../../../src/features/profile/hooks';

export default function ProfileScreen() {
  const { isLoading } = useMyProfile();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return <ProfileView />;
}
