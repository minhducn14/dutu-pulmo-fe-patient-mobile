import { Stack, useRouter } from 'expo-router';
import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useHospitals, useHospitalCities } from '@/hooks/useHospitals';
import type { HospitalResponseDto } from '@/types/hospital.types';

// ── Hospital Card ─────────────────────────────────────────────────────────────
function HospitalCard({ hospital }: { hospital: HospitalResponseDto }) {
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);
  const isClinic = hospital.name.toLowerCase().includes('phòng khám');
  const typeLabel = isClinic ? 'Phòng khám' : 'Bệnh viện';
  const typeColor = isClinic ? '#22C55E' : '#0A7CFF';
  const typeBg = isClinic ? '#F0FDF4' : '#EFF6FF';
  const logo = hospital.logoUrl;

  // Initials fallback (first letter of each word, max 2)
  const initials = hospital.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
        marginBottom: 12,
      }}
    >
      <Pressable
        onPress={() => router.push(`/hospitals/${hospital.id}` as any)}
        style={({ pressed }) => ({
          marginTop: 14,
          backgroundColor: '#EFF6FF',
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
          opacity: pressed ? 0.85 : 1,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
        })}
      >
        {/* Top row: logo + info */}
        <View style={{ flexDirection: 'row', gap: 14 }}>
          {/* Circular logo */}
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
              <Text
                style={{ fontSize: 22, fontWeight: '700', color: '#0A7CFF' }}
              >
                {initials}
              </Text>
            )}
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            {/* Type tag */}
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
              <Text
                style={{ color: typeColor, fontSize: 11, fontWeight: '600' }}
              >
                {typeLabel}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#1F2937',
                lineHeight: 22,
              }}
              numberOfLines={2}
            >
              {hospital.name}
            </Text>

            {hospital.province && (
              <Text
                style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}
                numberOfLines={1}
              >
                {hospital.province}
              </Text>
            )}
          </View>
        </View>

        {/* Address row */}
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
    </View>
  );
}

// ── Filter Bottom Sheet ───────────────────────────────────────────────────────
interface HospitalFilter {
  city: string;
  type: 'all' | 'hospital' | 'clinic';
}

function HospitalFilterSheet({
  visible,
  current,
  onApply,
  onClose,
}: {
  visible: boolean;
  current: HospitalFilter;
  onApply: (f: HospitalFilter) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<HospitalFilter>(current);
  const citiesQuery = useHospitalCities();

  const onOpen = useCallback(() => setDraft(current), [current]);

  const typeOptions: { value: HospitalFilter['type']; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'hospital', label: 'Bệnh viện' },
    { value: 'clinic', label: 'Phòng khám' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={onOpen}
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 32,
          maxHeight: '75%',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            backgroundColor: '#E2E8F0',
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 16,
          }}
        />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: 20,
          }}
        >
          Bộ lọc
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Type filter */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 12,
            }}
          >
            Loại cơ sở
          </Text>
          {typeOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setDraft((d) => ({ ...d, type: opt.value }))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#F8FAFC',
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: draft.type === opt.value ? '#0A7CFF' : '#CBD5E1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {draft.type === opt.value && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#0A7CFF',
                    }}
                  />
                )}
              </View>
              <Text style={{ fontSize: 14, color: '#374151' }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}

          {/* City filter */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#374151',
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            Tỉnh / Thành phố
          </Text>
          {[
            { value: '', label: 'Tất cả' },
            ...(citiesQuery.data ?? []).map((c) => ({ value: c, label: c })),
          ].map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setDraft((d) => ({ ...d, city: item.value }))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#F8FAFC',
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor:
                    draft.city === item.value ? '#0A7CFF' : '#CBD5E1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {draft.city === item.value && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#0A7CFF',
                    }}
                  />
                )}
              </View>
              <Text style={{ fontSize: 14, color: '#374151' }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <Pressable
            onPress={() => setDraft({ city: '', type: 'all' })}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              backgroundColor: '#F1F5F9',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: '#374151', fontWeight: '600' }}>
              Xoá bộ lọc
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              backgroundColor: '#0A7CFF',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Áp dụng</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export function HospitalListScreen() {
  const router = useRouter();
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

  const hasFilters = activeFilter.city || activeFilter.type !== 'all';

  const rawHospitals = hospitalsQuery.data?.items ?? [];
  const hospitals = rawHospitals.filter((h) => {
    if (activeFilter.type === 'clinic')
      return h.name.toLowerCase().includes('phòng khám');
    if (activeFilter.type === 'hospital')
      return !h.name.toLowerCase().includes('phòng khám');
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View
        style={{
          backgroundColor: '#0A7CFF',
          paddingTop: 52,
          paddingBottom: 16,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: -8, marginRight: 8 }}
          >
            <MaterialIcons name="arrow-back-ios" size={20} color="white" />
          </Pressable>
          <Text
            style={{ color: 'white', fontSize: 18, fontWeight: '700', flex: 1 }}
          >
            Cơ sở y tế
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 44,
            gap: 8,
          }}
        >
          <MaterialIcons name="search" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Tên bệnh viện, phòng khám..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={handleSearchChange}
            style={{ flex: 1, fontSize: 14, color: '#1F2937' }}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => {
                setSearch('');
                setSearchDebounced('');
              }}
            >
              <MaterialIcons name="close" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 8,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        }}
      >
        <Pressable
          onPress={() => setFilterVisible(true)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: hasFilters ? '#EFF6FF' : '#F8FAFC',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: hasFilters ? '#0A7CFF' : '#E2E8F0',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={16}
            color={hasFilters ? '#0A7CFF' : '#6B7280'}
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: hasFilters ? '#0A7CFF' : '#6B7280',
            }}
          >
            Bộ lọc{hasFilters ? ' •' : ''}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        {!hospitalsQuery.isLoading && (
          <Text style={{ fontSize: 12, color: '#94A3B8' }}>
            {hospitals.length} cơ sở
          </Text>
        )}
      </View>

      {/* List */}
      {hospitalsQuery.isLoading ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <ActivityIndicator size="large" color="#0A7CFF" />
          <Text style={{ color: '#94A3B8', fontSize: 14 }}>
            Đang tải cơ sở y tế...
          </Text>
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
              <Text style={{ color: '#0A7CFF', fontWeight: '600' }}>
                Xoá bộ lọc
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => <HospitalCard hospital={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <HospitalFilterSheet
        visible={filterVisible}
        current={activeFilter}
        onApply={(f) => setActiveFilter(f)}
        onClose={() => setFilterVisible(false)}
      />
    </View>
  );
}

export default HospitalListScreen;
