import { Image } from 'expo-image';

/**
 * Prefetch a single image
 */
export async function prefetchImage(uri: string): Promise<boolean> {
  try {
    await Image.prefetch(uri);
    return true;
  } catch (error) {
    console.warn('Failed to prefetch image:', uri, error);
    return false;
  }
}

/**
 * Prefetch multiple images
 */
export async function prefetchImages(uris: string[]): Promise<boolean[]> {
  return Promise.all(uris.map(prefetchImage));
}

/**
 * Prefetch images for a list of profiles (first photo of each)
 */
export async function prefetchProfileImages(
  profiles: Array<{ photos: Array<{ url?: string }> }>
): Promise<void> {
  const uris = profiles
    .map((profile) => profile.photos[0]?.url)
    .filter((url): url is string => !!url);

  await prefetchImages(uris);
}

/**
 * Prefetch all photos for a single profile
 */
export async function prefetchAllProfilePhotos(
  profile: { photos: Array<{ url?: string }> }
): Promise<void> {
  const uris = profile.photos
    .map((photo) => photo.url)
    .filter((url): url is string => !!url);

  await prefetchImages(uris);
}

/**
 * Clear image cache (useful for debugging or freeing memory)
 */
export async function clearImageCache(): Promise<void> {
  try {
    await Image.clearDiskCache();
    await Image.clearMemoryCache();
  } catch (error) {
    console.warn('Failed to clear image cache:', error);
  }
}

/**
 * Get cache size info (for debugging)
 */
export async function getCacheInfo(): Promise<{
  diskCacheSize: number;
}> {
  // expo-image doesn't expose cache size directly
  // This is a placeholder for potential future implementation
  return {
    diskCacheSize: 0,
  };
}
