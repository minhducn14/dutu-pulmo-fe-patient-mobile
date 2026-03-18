import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  hideBack?: boolean;
  rightSlot?: ReactNode;
  backgroundColor?: string;
}

export function ScreenHeader({
  title,
  onBack,
  hideBack = false,
  rightSlot,
  backgroundColor = theme.colors.primary,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      style={{
        backgroundColor,
        paddingTop: insets.top + 12,
        paddingBottom: 16,
        paddingHorizontal: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {!hideBack ? (
        <Pressable
          onPress={handleBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ padding: 4 }}
        >
          <MaterialIcons name="arrow-back-ios-new" size={22} color="white" />
        </Pressable>
      ) : (
        <View style={{ width: 30 }} />
      )}

      <Text
        style={{
          color: 'white',
          fontSize: theme.typography.lg,
          fontWeight: '700',
          flex: 1,
          textAlign: 'center',
          marginHorizontal: theme.spacing.sm,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={{ width: 30, alignItems: 'flex-end' }}>{rightSlot ?? null}</View>
    </View>
  );
}

export default ScreenHeader;

