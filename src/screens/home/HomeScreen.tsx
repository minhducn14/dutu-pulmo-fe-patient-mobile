import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { DoctorAvatar } from '@/components/home/DoctorAvatar';
import { FacilityCard } from '@/components/home/FacilityCard';
import { Header } from '@/components/home/Header';
import { NewsCard } from '@/components/home/NewsCard';
import type { NewsItem } from '@/components/home/NewsCard';
import { PromoBanner } from '@/components/home/PromoBanner';
import { QuickActions } from '@/components/home/QuickActions';
import type { QuickAction } from '@/components/home/QuickActions';
import { SectionHeader } from '@/components/home/SectionHeader';
import { SpecialtyGrid } from '@/components/home/SpecialtyGrid';
import { theme } from '@/constants/theme';
import { usePublicDoctors, useSpecialties } from '@/hooks/useAppointments';
import { useHospitals } from '@/hooks/useHospitals';
import { Loading } from '@/components/ui/Loading';

const today = new Date().toLocaleDateString('vi-VN');

const NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Cách bảo vệ phổi hiệu quả trong mùa ô nhiễm',
    date: today,
    badge: 'Nổi bật',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_iLiX96-7KdxD4YhY0FSz0j7UjUIwRaf_hijFJXoGnoU0IKtsM5oAaEYSD5faycH9y8oNIauP5l9PXYxdsY8BgA76M9mLZJ8ee-3zNiE5svEEj9YwZ2w1qWdc7fqr3OPfkX5dkfXBaLvlobTs2n7EgUxU2vrO2z08OQ7LYxOz-yk62p01ISci48F58PYinPutu76l38sDmsdKyYvzADcFQ5Ir61f-_9CilNd2SDQQ-joUrGyreyvry5R-zRH__G7ns7a-0x5bTuPF',
  },
  {
    id: '2',
    title: '5 loại thực phẩm "vàng" giúp thanh lọc phổi',
    date: today,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDuT8PX4pCe44kEMMhyHmWX_Lu8fVS07PKoL9Mlcj-hpq61iUxwNd0HtAGHEpSvERiEDZx2SOGC2ux-14VEWoRQ3QTtXbX1hb_XROkDVvUjJXMCmnFCbrjerRmFIQONHmn4kVqrmJZh_3HXTwJAxAG7TZxYakAAW57D-mE4oazGNsaBRcMWZKAgsWK463Z130Kp86aTSo1SGa5mMMjzFcezqP5lQ_KuTh7i5bSDiVXI30RnFv_VOhvhjHcfENOSRCgzy7vslHqkek-e',
  },
  {
    id: '3',
    title: 'Tầm soát ung thư phổi: Khi nào cần thực hiện?',
    date: today,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Z35PMEKVy1oCowwCra6qNghyrapFVbSjVECe3cNKjl9gZJHbC4gWSbILWcIonzWzC2L-dgPNFoAVbfFQj8SIDoprB3jEKaqmVyP6_DkfYIAuSHJxPiThA1CjgGDL1vIkDu8l4o0VvJbY1M-7mGIRoFs5AbQiuFe9F8eVabNuGTYVUXVKT5QW0pmOXYzTKTwkDUyGpEZGa_xZ-2_an9chkmWtjg9hPXGNeXRmlFf3hHtS1ahwIv5dJKZmRNMlXphQUS7w_KvcyEMB',
  },
];

export function HomeScreen() {
  const router = useRouter();
  const doctorsQuery = usePublicDoctors({ page: 1, limit: 4 });
  const hospitalsQuery = useHospitals({ page: 1, limit: 4 });
  const specialtiesQuery = useSpecialties();

  const quickActions: QuickAction[] = [
    {
      key: 'doctors',
      label: 'Đặt khám\nbác sĩ',
      iconName: 'person-search',
      color: theme.colors.primary,
      bg: '#EFF6FF',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'clinic',
      label: 'Phòng\nkhám',
      iconName: 'local-hospital',
      color: theme.colors.secondary,
      bg: '#F0FDF4',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'hospital',
      label: 'Bệnh\nviện',
      iconName: 'apartment',
      color: theme.colors.primary,
      bg: '#EFF6FF',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'support',
      label: 'Hỗ trợ',
      iconName: 'center-focus-strong',
      color: '#4F46E5',
      bg: '#EEF2FF',
      onPress: () => router.push('/(tabs)/support'),
    },
    {
      key: 'chat',
      label: 'Chat\nbác sĩ',
      iconName: 'chat-bubble',
      color: theme.colors.secondary,
      bg: '#F0FDF4',
      onPress: () => router.push('/(tabs)/chat'),
    },
    {
      key: 'video',
      label: 'Đặt lịch\ntư vấn',
      iconName: 'calendar-month',
      color: theme.colors.primary,
      bg: '#EFF6FF',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'records',
      label: 'Hồ sơ\nsức khỏe',
      iconName: 'assignment',
      color: theme.colors.secondary,
      bg: '#F0FDF4',
      onPress: () => router.push('/medical-records'),
    },
    {
      key: 'news',
      label: 'Tin\ntức',
      iconName: 'article',
      color: theme.colors.primary,
      bg: '#EFF6FF',
      onPress: () => router.push('/settings'),
    },
  ];

  if (doctorsQuery.isLoading) return <Loading label="Đang tải..." />;

  if (doctorsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <MaterialIcons name="wifi-off" size={48} color="#CBD5E1" />
        <Text className="text-slate-400 text-sm mt-3 text-center">
          Không thể tải dữ liệu. Vui lòng thử lại sau.
        </Text>
      </View>
    );
  }

  const doctors = doctorsQuery.data?.items ?? [];

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <Header />

      <View className="px-4 pt-11 gap-6">
        <PromoBanner />
        <QuickActions actions={quickActions} />

        <View>
          <SectionHeader title="Bác sĩ nổi bật" onSeeAll={() => router.push('/doctors')} />
          {doctors.length === 0 ? (
            <View className="py-5 items-center">
              <MaterialIcons name="person-search" size={36} color="#CBD5E1" />
              <Text className="text-slate-400 text-sm mt-2">Chưa có dữ liệu bác sĩ</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={doctors}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
              renderItem={({ item: doctor }) => (
                <Pressable
                  onPress={() => router.push(`/doctors/${doctor.id}`)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                  className="w-[152px] bg-white p-3 rounded-[18px] border border-slate-100 shadow-sm elevation-1"
                >
                  <DoctorAvatar avatarUrl={doctor.avatarUrl} name={doctor.fullName} />
                  <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>
                    {doctor.fullName || 'Bác sĩ'}
                  </Text>
                  <Text className="text-[11px] text-gray-500 mt-0.5 mb-1" numberOfLines={1}>
                    {doctor.specialty || 'Hô hấp'}
                  </Text>
                  {!!doctor.yearsOfExperience && (
                    <Text className="text-[10px] text-slate-400 mb-1">
                      {doctor.yearsOfExperience} năm KN
                    </Text>
                  )}
                  <View className="flex-row items-center gap-1">
                    <MaterialIcons name="star" size={14} color="#FBBF24" />
                    <Text className="text-xs font-bold text-gray-800">
                      {parseFloat((doctor as any).averageRating ?? '0').toFixed(1)}
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      ({(doctor as any).totalReviews ?? 0})
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>

        <View>
          <SectionHeader title="Cơ sở y tế" onSeeAll={() => router.push('/hospitals' as any)} />
          {hospitalsQuery.isLoading ? (
            <Text className="text-slate-400 text-sm mt-2">Đang tải dữ liệu...</Text>
          ) : hospitalsQuery.isError ? (
            <Text className="text-slate-400 text-sm mt-2">Không thể tải dữ liệu cơ sở y tế</Text>
          ) : !hospitalsQuery.data?.items?.length ? (
            <View className="py-5 items-center">
              <MaterialIcons name="apartment" size={36} color="#CBD5E1" />
              <Text className="text-slate-400 text-sm mt-2">Chưa có dữ liệu cơ sở y tế</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={hospitalsQuery.data.items}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
              renderItem={({ item: h }) => {
                const isClinic = h.name.toLowerCase().includes('phòng khám');
                return (
                  <FacilityCard
                    item={{
                      id: h.id,
                      name: h.name,
                      address: h.address,
                      type: isClinic ? 'Phòng khám' : 'Bệnh viện',
                      distance: '2.5 km',
                      logo:
                        h.logoUrl ||
                        'https://cdn-icons-png.flaticon.com/512/3063/3063206.png',
                      typeColor: isClinic ? theme.colors.secondary : theme.colors.primary,
                      typeBg: isClinic ? '#F0FDF4' : '#EFF6FF',
                    }}
                  />
                );
              }}
            />
          )}
        </View>

        <View>
          <SectionHeader
            title="Khám theo chuyên khoa"
            onSeeAll={() => router.push('/specialties' as any)}
          />
          {specialtiesQuery.isLoading ? (
            <Text className="text-slate-400 text-sm mt-2">Đang tải...</Text>
          ) : (
            <SpecialtyGrid items={specialtiesQuery.data || []} />
          )}
        </View>

        <View className="pb-8">
          <SectionHeader title="Tin tức y khoa" onSeeAll={() => router.push('/news' as any)} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={NEWS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 16, paddingRight: 16, paddingBottom: 4 }}
            renderItem={({ item }) => <NewsCard item={item} />}
          />
        </View>
      </View>
    </ScrollView>
  );
}

export default HomeScreen;
