import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HospitalCard } from '@/components/hospital/HospitalCard';
import { HospitalFilterSheet } from '@/components/hospital/HospitalFilterSheet';
import type { HospitalFilter } from '@/components/hospital/HospitalFilterSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { theme } from '@/constants/theme';
import { useHospitals } from '@/hooks/useHospitals';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';

export function HospitalListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<HospitalFilter>({
    city: '',
    type: 'all',
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchDebounced(text), 400);
  };

  const hospitalsQuery = useHospitals({
    search: searchDebounced || undefined,
    city: activeFilter.city || undefined,
    page: 1,
    limit: 50,
  });

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await hospitalsQuery.refetch();
  });

  const hasFilters = activeFilter.city || activeFilter.type !== 'all';
  const rawHospitals = hospitalsQuery.data?.items ?? [];

  const hospitals = rawHospitals.filter((h) => {
    if (activeFilter.type === 'clinic') return h.name.toLowerCase().includes('phòng khám');
    if (activeFilter.type === 'hospital') return !h.name.toLowerCase().includes('bệnh viện');
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Cơ sở y tế" onBack={() => router.back()} />

      {/* Floating search bar (homepage style) */}
      <View
        className="mx-4 -mt-7 h-14 flex-row items-center rounded-2xl bg-white px-3.5"
        style={
          {
            ...theme.shadow.card,
            marginTop: 20,
          }
        }
      >
        <MaterialIcons
          name="search"
          size={22}
          color="#94A3B8"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Tên bệnh viện, phòng khám..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={handleSearchChange}
          style={{ flex: 1, fontSize: 13, color: '#1F2937', fontWeight: '500' }}
          returnKeyType="search"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {search.length > 0 && (
            <Pressable
              onPress={() => {
                setSearch('');
                setSearchDebounced('');
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={18} color="#94A3B8" />
            </Pressable>
          )}

          <View style={{ width: 1, height: 24, backgroundColor: '#E2E8F0', marginHorizontal: 4 }} />

          <Pressable
            onPress={() => setFilterVisible(true)}
            style={({ pressed }) => ({
              padding: 4,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View>
              <MaterialCommunityIcons
                name="tune-variant"
                size={22}
                color={hasFilters ? '#0A7CFF' : '#64748B'}
              />
              {hasFilters && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: '#EF4444',
                    borderWidth: 1,
                    borderColor: 'white',
                  }}
                />
              )}
            </View>
          </Pressable>
        </View>
      </View>

      {/* Tabs (card container) */}
      <View className="mx-4 mt-3 rounded-2xl bg-white px-3 py-2.5" style={theme.shadow.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#F1F5F9',
              borderRadius: 20,
              padding: 3,
              flex: 1,
              maxWidth: 240,
            }}
          >
            {(
              [
                { key: 'all', label: 'Tất cả' },
                { key: 'hospital', label: 'Bệnh viện' },
                { key: 'clinic', label: 'Phòng khám' },
              ] as const
            ).map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveFilter(prev => ({ ...prev, type: tab.key }))}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: 16,
                  backgroundColor: activeFilter.type === tab.key ? '#FFFFFF' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: activeFilter.type === tab.key ? '#0A7CFF' : '#64748B',
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {!hospitalsQuery.isLoading && (
            <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8 }}>{hospitals.length} cơ sở</Text>
          )}
        </View>
      </View>

      {hospitalsQuery.isLoading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}
        >
          <ActivityIndicator size="large" color="#0A7CFF" />
          <Text style={{ color: '#94A3B8', fontSize: 14 }}>Đang tải cơ sở y tế...</Text>
        </View>
      ) : hospitals.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 40,
          }}
        >
          <MaterialIcons name="apartment" size={56} color="#CBD5E1" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151' }}>
            Không tìm thấy cơ sở
          </Text>
          <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>
            Thử thay đổi từ khoá hoặc xoá bộ lọc.
          </Text>
          {hasFilters && (
            <Pressable
              onPress={() => setActiveFilter({ city: '', type: 'all' })}
              style={({ pressed }) => ({
                backgroundColor: '#EFF6FF',
                borderRadius: 12,
                paddingHorizontal: 20,
                paddingVertical: 10,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: '#0A7CFF', fontWeight: '600' }}>Xoá bộ lọc</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 32) }}
          renderItem={({ item }) => (
            <HospitalCard
              hospital={item}
              onPress={() => router.push(`/hospitals/${item.id}`)}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <HospitalFilterSheet
        visible={filterVisible}
        current={activeFilter}
        onApply={setActiveFilter}
        onClose={() => setFilterVisible(false)}
      />
    </View>
  );
}

export default HospitalListScreen;

