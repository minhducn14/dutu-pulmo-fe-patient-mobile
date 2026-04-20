import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  RefreshControl,
} from 'react-native';

import { DoctorCard } from '@/components/doctor/DoctorCard';
import { DoctorFilterSheet } from '@/components/doctor/DoctorFilterSheet';
import type { DoctorFilterState } from '@/components/doctor/DoctorFilterSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { usePublicDoctors } from '@/hooks/useAppointments';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { theme } from '@/constants/theme';
import type { AppointmentTypeFilter } from '@/services/appointment.service';

export function DoctorListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ specialty?: string }>();
  const [activeTab, setActiveTab] = useState<AppointmentTypeFilter>('all');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DoctorFilterState>({
    specialty: params.specialty || '',
    hospitalId: '',
  });

  useEffect(() => {
    if (params.specialty) {
      setActiveFilter(prev => ({ ...prev, specialty: params.specialty! }));
    }
  }, [params.specialty]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchDebounced(text), 400);
  };

  const doctorsQuery = usePublicDoctors({
    page: 1,
    limit: 20,
    search: searchDebounced || undefined,
    specialty: activeFilter.specialty || undefined,
    hospitalId: activeFilter.hospitalId || undefined,
    appointmentType: activeTab,
  });

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await doctorsQuery.refetch();
  });

  const hasFilters = activeFilter.specialty || activeFilter.hospitalId;
  const doctors = doctorsQuery.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Tìm bác sĩ" onBack={() => router.back()} />

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
          placeholder="Tên bác sĩ, triệu chứng, chuyên khoa"
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
              flexDirection: 'row',
              alignItems: 'center',
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
                { key: 'offline', label: 'Lịch khám' },
                { key: 'online', label: 'Lịch tư vấn' },
              ] as const
            ).map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: 16,
                  backgroundColor: activeTab === tab.key ? '#FFFFFF' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: activeTab === tab.key ? '#0A7CFF' : '#64748B',
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {!doctorsQuery.isLoading && (
            <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8 }}>{doctors.length} bác sĩ</Text>
          )}
        </View>
      </View>

      {
        doctorsQuery.isLoading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}
          >
            <ActivityIndicator size="large" color="#0A7CFF" />
            <Text style={{ color: '#94A3B8', fontSize: 14 }}>Đang tìm bác sĩ phù hợp...</Text>
          </View>
        ) : doctors.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 40,
            }}
          >
            <MaterialCommunityIcons name="doctor" size={56} color="#CBD5E1" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151' }}>
              Không tìm thấy bác sĩ
            </Text>
            <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>
              Thử thay đổi từ khoá tìm kiếm hoặc xoá bộ lọc để xem thêm kết quả.
            </Text>
            {hasFilters && (
              <Pressable
                onPress={() => setActiveFilter({ specialty: '', hospitalId: '' })}
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
            data={doctors}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            renderItem={({ item }) => (
              <DoctorCard doctor={item} onPress={() => router.push(`/doctors/${item.id}`)} />
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )
      }

      <DoctorFilterSheet
        visible={filterVisible}
        current={activeFilter}
        onApply={setActiveFilter}
        onClose={() => setFilterVisible(false)}
      />
    </View >
  );
}

export default DoctorListScreen;
