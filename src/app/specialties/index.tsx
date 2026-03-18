import { Stack, useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSpecialties } from '@/hooks/useAppointments';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SpecialtyCard } from '@/components/doctor/SpecialtyCard';
import { theme } from '@/constants/theme';
import { getSpecialtyLabel } from '@/utils/doctor-display';

const getSpecialtyConfig = (specialty: string) => {
  switch (specialty) {
    case 'Pulmonology':
      return { icon: 'lungs', color: '#0A7CFF', bg: '#EFF6FF' };
    case 'Thoracic Surgery':
      return { icon: 'heart-pulse', color: '#22C55E', bg: '#F0FDF4' };
    case 'Respiratory Medicine':
      return { icon: 'stethoscope', color: '#4F46E5', bg: '#EEF2FF' };
    case 'Tuberculosis':
      return { icon: 'virus', color: '#EF4444', bg: '#FEF2F2' };
    default:
      return { icon: 'medical-bag', color: '#6B7280', bg: '#F3F4F6' };
  }
};

export default function SpecialtiesScreen() {
  const router = useRouter();
  const { data, isLoading } = useSpecialties();
  const [search, setSearch] = useState('');

  const filteredSpecialties = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    return data.filter((s) => 
      getSpecialtyLabel(s).toLowerCase().includes(search.toLowerCase()) ||
      s.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Chuyên khoa" onBack={() => router.back()} />

      <View
        className="mx-4 -mt-7 h-14 flex-row items-center rounded-2xl bg-white px-3.5"
        style={{
          ...theme.shadow.card,
          marginTop: 20,
        }}
      >
        <MaterialIcons
          name="search"
          size={22}
          color="#94A3B8"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Tìm chuyên khoa..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '500' }}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={18} color="#94A3B8" />
          </Pressable>
        )}
      </View>

      <View style={{ flex: 1, marginTop: 8 }}>
        {isLoading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8' }}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSpecialties}
            keyExtractor={(item) => item}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
            renderItem={({ item }) => {
              const { icon, color, bg } = getSpecialtyConfig(item);
              const label = getSpecialtyLabel(item);
              return (
                <SpecialtyCard
                  label={label}
                  icon={icon}
                  color={color}
                  backgroundColor={bg}
                  onPress={() => router.push({ pathname: '/doctors', params: { specialty: item } })}
                />
              );
            }}
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: 'center' }}>
                <MaterialIcons name="search-off" size={48} color="#CBD5E1" />
                <Text style={{ marginTop: 16, color: '#64748B', fontSize: 15 }}>
                  Không tìm thấy chuyên khoa phù hợp
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

