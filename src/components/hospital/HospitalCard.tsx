import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import type { HospitalResponseDto } from '@/types/hospital.types';
import { theme } from '@/constants/theme';

interface HospitalCardProps {
  hospital: HospitalResponseDto;
  onPress: () => void;
}

export function HospitalCard({ hospital, onPress }: HospitalCardProps) {
  const [logoError, setLogoError] = useState(false);
  const isClinic = hospital.name.toLowerCase().includes('phòng khám');
  const typeLabel = isClinic ? 'Phòng khám' : 'Bệnh viện';
  const typeColor = isClinic ? '#22C55E' : '#0A7CFF';
  const typeBg = isClinic ? '#F0FDF4' : '#EFF6FF';
  const logo = hospital.logoUrl;

  const initials = hospital.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-slate-100 bg-white p-4"
      style={({ pressed }) => ({
        ...theme.shadow.card,
        opacity: pressed ? 0.93 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              overflow: 'hidden',
              backgroundColor: '#DBEAFE',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {logo && !logoError ? (
              <Image
                source={{ uri: logo }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#0A7CFF' }}>{initials}</Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: typeBg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                marginBottom: 6,
              }}
            >
              <Text style={{ color: typeColor, fontSize: 11, fontWeight: '600' }}>{typeLabel}</Text>
            </View>

            <Text
              style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', lineHeight: 22 }}
              numberOfLines={2}
            >
              {hospital.name}
            </Text>

            {hospital.province && (
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
                {hospital.province}
              </Text>
            )}
          </View>
        </View>

        {hospital.address && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 6,
              marginTop: 12,
            }}
          >
            <MaterialIcons
              name="location-on"
              size={14}
              color="#6B7280"
              style={{ marginTop: 1 }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                color: '#6B7280',
                lineHeight: 18,
              }}
              numberOfLines={2}
            >
              {hospital.address}
            </Text>
          </View>
        )}
    </Pressable>
  );
}

