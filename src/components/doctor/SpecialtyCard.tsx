import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';

import { theme } from '@/constants/theme';

interface SpecialtyCardProps {
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function SpecialtyCard({
  label,
  icon,
  color,
  backgroundColor,
  onPress,
  style,
}: SpecialtyCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-slate-100 bg-white p-4"
      style={({ pressed }) => ({
        ...theme.shadow.card,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: backgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name={icon as any} size={28} color={color} />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: 2,
            }}
          >
            {label}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B' }}>
            Xem danh sách bác sĩ
          </Text>
        </View>

        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#F8FAFC',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
        </View>
      </View>
    </Pressable>
  );
}
