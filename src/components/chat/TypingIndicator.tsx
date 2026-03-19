import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

import { Bot } from 'lucide-react-native';

const Dot = ({ delay }: { delay: number }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 400, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(0, { duration: 400, easing: Easing.bezier(0.33, 0, 0.67, 1) })
        ),
        -1,
        false
      )
    );
  }, [delay, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: theme.colors.primary,
          marginHorizontal: 1.5,
        },
        animatedStyle,
      ]}
    />
  );
};

export const TypingIndicator = () => {
  return (
    <View className="flex-row items-end gap-2 mb-4">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-100 mb-1">
        <Bot size={18} color={theme.colors.primary} />
      </View>
      <View 
        className="flex-row items-center justify-center rounded-2xl bg-white border border-slate-100 px-4 h-10" 
        style={theme.shadow.card}
      >
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
};
