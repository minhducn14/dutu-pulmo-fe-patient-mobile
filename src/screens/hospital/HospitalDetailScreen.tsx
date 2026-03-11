import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Image, Pressable, Linking } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useHospitalDetail, useHospitalDoctors } from '@/hooks/useHospitals';

export function HospitalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const hospitalQuery = useHospitalDetail(id);
  const doctorsQuery = useHospitalDoctors(id, 1, 10);

  const h = hospitalQuery.data;
  const logo = h?.logoUrl ?? 'https://cdn-icons-png.flaticon.com/512/3063/3063206.png';
  const isClinic = h?.name.toLowerCase().includes('phòng khám') ?? false;
  const typeLabel = isClinic ? 'Phòng khám' : 'Bệnh viện';
  const typeColor = isClinic ? '#22C55E' : '#0A7CFF';
  const typeBg = isClinic ? '#F0FDF4' : '#EFF6FF';

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header overlay */}
      <View
        style={{
          backgroundColor: '#0A7CFF',
          paddingTop: 52,
          paddingBottom: 56,
          paddingHorizontal: 16,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8, marginBottom: 8 }}>
          <MaterialIcons name="arrow-back-ios" size={20} color="white" />
        </Pressable>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', lineHeight: 28 }}>
          {hospitalQuery.isLoading ? 'Đang tải...' : h?.name ?? 'Cơ sở y tế'}
        </Text>
        {h && (
          <View style={{ marginTop: 8, flexDirection: 'row' }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{typeLabel}</Text>
            </View>
          </View>
        )}
      </View>

      {hospitalQuery.isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#94A3B8' }}>Đang tải thông tin...</Text>
        </View>
      ) : !h ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#EF4444' }}>Không tìm thấy thông tin cơ sở y tế</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, marginTop: -28 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Info card */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              marginHorizontal: 16,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {/* Logo + type badge */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 14,
                  overflow: 'hidden',
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#F1F5F9',
                }}
              >
                <Image source={{ uri: logo }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: typeBg,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: typeColor, fontSize: 11, fontWeight: '600' }}>{typeLabel}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', lineHeight: 22 }}>
                  {h.name}
                </Text>
                {h.province && (
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{h.province}</Text>
                )}
              </View>
            </View>

            {/* Detail info rows */}
            <View style={{ gap: 14 }}>
              {h.address && (
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="location-on" size={18} color="#0A7CFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2, fontWeight: '500' }}>ĐỊA CHỈ</Text>
                    <Text style={{ fontSize: 14, color: '#1F2937', lineHeight: 20 }}>{h.address}</Text>
                  </View>
                </View>
              )}
              {h.phone && (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${h.phone}`)}
                  style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="phone" size={18} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2, fontWeight: '500' }}>ĐIỆN THOẠI</Text>
                    <Text style={{ fontSize: 14, color: '#0A7CFF', fontWeight: '600' }}>{h.phone}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color="#CBD5E1" />
                </Pressable>
              )}
              {h.email && (
                <Pressable
                  onPress={() => Linking.openURL(`mailto:${h.email}`)}
                  style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="email" size={18} color="#F97316" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2, fontWeight: '500' }}>EMAIL</Text>
                    <Text style={{ fontSize: 14, color: '#0A7CFF', fontWeight: '600' }}>{h.email}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color="#CBD5E1" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Doctors section */}
          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F2937' }}>Đội ngũ bác sĩ</Text>
              <Pressable onPress={() => router.push(`/doctors?hospitalId=${id}` as any)}>
                <Text style={{ fontSize: 13, color: '#0A7CFF', fontWeight: '600' }}>Xem tất cả</Text>
              </Pressable>
            </View>

            {doctorsQuery.isLoading ? (
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>Đang tải...</Text>
            ) : !doctorsQuery.data?.items?.length ? (
              <View style={{ padding: 24, alignItems: 'center', backgroundColor: 'white', borderRadius: 16 }}>
                <MaterialIcons name="person-search" size={36} color="#CBD5E1" />
                <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 8 }}>Chưa có bác sĩ tại cơ sở này</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              >
                {doctorsQuery.data!.items.map((d) => {
                  const initials = d.fullName
                    ? d.fullName.split(' ').slice(-2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')
                    : '?';
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() => router.push(`/doctors/${d.id}`)}
                      style={({ pressed }) => ({
                        width: 140,
                        backgroundColor: 'white',
                        borderRadius: 16,
                        padding: 14,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#F1F5F9',
                        shadowColor: '#000',
                        shadowOpacity: 0.04,
                        shadowRadius: 6,
                        elevation: 1,
                        opacity: pressed ? 0.9 : 1,
                      })}
                    >
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          overflow: 'hidden',
                          backgroundColor: '#DBEAFE',
                          alignItems: 'center',
                          justifyContent: 'center',
                          alignSelf: 'center',
                          marginBottom: 10,
                        }}
                      >
                        {d.avatarUrl ? (
                          <Image source={{ uri: d.avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0A7CFF' }}>{initials}</Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1F2937', textAlign: 'center' }} numberOfLines={2}>
                        {d.fullName ?? 'Bác sĩ'}
                      </Text>
                      {d.specialty && (
                        <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4 }} numberOfLines={1}>
                          {d.specialty}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default HospitalDetailScreen;
