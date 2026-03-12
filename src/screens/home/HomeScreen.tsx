import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Loading } from '@/components/ui/Loading';
import { useAuthStore } from '@/store/auth.store';
import { usePublicDoctors, useSpecialties } from '@/hooks/useAppointments';
import { useHospitals } from '@/hooks/useHospitals';
import { theme } from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────
interface QuickAction {
  key: string;
  label: string;
  iconName: string;
  iconLib: 'material' | 'community';
  color: string;
  bg: string;
  onPress: () => void;
}

interface Facility {
  id: string;
  name: string;
  address: string;
  type: string;
  distance: string;
  logo: string;
  typeColor: string;
  typeBg: string;
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
  image: string;
  badge?: string;
}

// ─── DoctorAvatar ─────────────────────────────────────────────────────────────
function DoctorAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl?: string;
  name?: string;
}) {
  const [hasError, setHasError] = useState(false);

  const initials = name
    ? name
      .split(' ')
      .slice(-2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
    : '?';

  const showImage = !!avatarUrl && !hasError;

  return (
    <View className="w-24 h-24 rounded-full overflow-hidden mb-2.5 bg-slate-100 self-center">
      {showImage ? (
        <Image
          source={{ uri: avatarUrl }}
          className="w-full h-full"
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-blue-100">
          <Text className="text-3xl font-bold text-blue-600">{initials}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header() {
  const { user } = useAuthStore();
  const currentHour = new Date().getHours();
  let greeting = 'Chào buổi tối!';
  if (currentHour < 12) greeting = 'Chào buổi sáng!';
  else if (currentHour < 18) greeting = 'Chào buổi chiều!';

  return (
    <View className="bg-primary pt-14 pb-14 px-4 rounded-b-3xl">
      {/* Top bar */}
      <View className="flex-row items-center justify-between mb-6">
        {/* Logo + User */}
        <View className="flex-row items-center gap-3">
          {/* Logo */}
          <View className="flex-row items-center gap-2 pr-3 border-r border-white/20">
            <View className="w-10 h-10 bg-white rounded-xl items-center justify-center overflow-hidden">
              <Image
                source={require('@/assets/images/logo.jpg')}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="text-white font-bold text-base leading-tight">
                Dutu
              </Text>
              <Text className="text-secondary font-bold text-base leading-tight">
                Pulmo
              </Text>
            </View>
          </View>

          {/* User */}
          <View className="flex-row items-center gap-2 pl-1">
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlsQ3DvfFlr_UgmmwE9It1YpLX8WBOWH06ZQqHysA90z-joKXMu4MZhrbe-cPkp1V9u1uEhXXfEPBL7Tw7C_c9xGTQuY7Del_d-yQpoVNHAWTxYvVf_MiAbNF-0SRxRH6OYRq3__dNi_pR5fBRRP56xt_RP7yrMgDkOqmh8vE5v2PhHBBf4GzodYp-JO5RVpHaBQhDZSlh9X3BTCHvX3U2i-IFMBYoQT626xH4aUrD9qM7q6tlAywfRcibQz5e0bG6lIEveyWKPEFJ',
              }}
              className="w-10 h-10 rounded-full border border-white/30"
            />
            <View>
              <Text className="text-white/80 text-xs font-semibold uppercase tracking-wide">
                {greeting}
              </Text>
              <Text className="text-white font-bold text-base">
                {user?.fullName || 'Khách'}
              </Text>
            </View>
          </View>
        </View>

        {/* Notification */}
        <View className="relative">
          <View className="w-10 h-10 rounded-full bg-white/15 items-center justify-center">
            <MaterialIcons name="notifications" size={22} color="white" />
          </View>
          <View className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 border-2 border-primary items-center justify-center">
            <Text className="text-white text-[9px] font-bold">4</Text>
          </View>
        </View>
      </View>

      {/* Search bar */}
      <View className="absolute -bottom-7 left-4 right-4 bg-white rounded-2xl h-14 flex-row items-center px-3.5 shadow-md elevation-6">
        <MaterialIcons
          name="search"
          size={22}
          color="#94A3B8"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Tìm bác sĩ, chuyên khoa, bệnh viện..."
          placeholderTextColor="#94A3B8"
          className="flex-1 text-sm text-gray-800 font-medium"
        />
      </View>
    </View>
  );
}

// ─── PromoBanner ──────────────────────────────────────────────────────────────
const BANNERS = [
  {
    id: '1',
    badge: 'CHĂM SÓC TOÀN DIỆN',
    title: 'Chăm sóc sức khỏe\nphổi toàn diện',
    cta: 'Khám phá ngay',
    overlay: 'rgba(10,124,255,0.85)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYxDTSa51LrRLJsK4BTzCss1JQTQgnOsX1g-rO51r4EYTNrOScpK4-yHLycKeck2A6sz5r7eNc0zjmL6YNawHTzluXZGmE2iF9frPWZ4p9kcR1nQtCJa5iXD1j5AdfyQ-kdLYVVl7Q55GNFCe54ayCKMrqWkDVBL98PLgbXttWefV2WKqsVIxEcdTPXyx1lU-p3g49wDyuH2l2ued3MBzemwNuXJMYR1NqSTZDQNsh4yFkPQDZF9yKfBr5LsZh7EH831C-k0gKAo0m',
  },
  {
    id: '2',
    badge: 'ĐẶT LỊCH NGAY',
    title: 'Hơn 50 bác sĩ\nchuyên khoa hô hấp',
    cta: 'Đặt lịch khám',
    overlay: 'rgba(5,150,105,0.85)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_iLiX96-7KdxD4YhY0FSz0j7UjUIwRaf_hijFJXoGnoU0IKtsM5oAaEYSD5faycH9y8oNIauP5l9PXYxdsY8BgA76M9mLZJ8ee-3zNiE5svEEj9YwZ2w1qWdc7fqr3OPfkX5dkfXBaLvlobTs2n7EgUxU2vrO2z08OQ7LYxOz-yk62p01ISci48F58PYinPutu76l38sDmsdKyYvzADcFQ5Ir61f-_9CilNd2SDQQ-joUrGyreyvry5R-zRH__G7ns7a-0x5bTuPF',
  },
  {
    id: '3',
    badge: 'CÔNG NGHỆ AI',
    title: 'Phân tích X-quang\nphổi bằng AI',
    cta: 'Thử ngay miễn phí',
    overlay: 'rgba(79,70,229,0.85)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Z35PMEKVy1oCowwCra6qNghyrapFVbSjVECe3cNKjl9gZJHbC4gWSbILWcIonzWzC2L-dgPNFoAVbfFQj8SIDoprB3jEKaqmVyP6_DkfYIAuSHJxPiThA1CjgGDL1vIkDu8l4o0VvJbY1M-7mGIRoFs5AbQiuFe9F8eVabNuGTYVUXVKT5QW0pmOXYzTKTwkDUyGpEZGa_xZ-2_an9chkmWtjg9hPXGNeXRmlFf3hHtS1ahwIv5dJKZmRNMlXphQUS7w_KvcyEMB',
  },
];

function PromoBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { width } = useWindowDimensions();
  const ITEM_WIDTH = width - 32; // px-4 on each side

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
    setActiveIndex(idx);
  };

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={BANNERS}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width: ITEM_WIDTH }} className="h-44 rounded-2xl overflow-hidden relative">
            <Image
              source={{ uri: item.image }}
              className="absolute inset-0 w-full h-full"
              resizeMode="cover"
            />
            <View style={{ backgroundColor: item.overlay }} className="absolute inset-0" />
            <View className="absolute top-0 bottom-0 left-0 w-1.5 bg-secondary" />

            <View className="absolute top-0 bottom-0 left-5 right-4 justify-center">
              <View className="flex-row items-center gap-2 mb-2.5">
                <View className="bg-white/20 border border-white/25 rounded-lg px-2.5 py-1">
                  <Text className="text-white text-[10px] font-bold tracking-wide">
                    {item.badge}
                  </Text>
                </View>
                <View className="w-2 h-2 rounded-full bg-secondary" />
              </View>

              <Text className="text-white text-xl font-bold leading-7 mb-4">
                {item.title}
              </Text>

              <Pressable
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                className="bg-secondary rounded-xl px-5 py-2.5 self-start flex-row items-center gap-1.5"
              >
                <Text className="text-white text-sm font-bold">{item.cta}</Text>
                <MaterialIcons name="arrow-forward" size={16} color="white" />
              </Pressable>
            </View>

            {/* Pagination dots */}
            <View className="absolute bottom-3 right-4 flex-row gap-1.5">
              {BANNERS.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === activeIndex ? 16 : 6,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: i === activeIndex ? 'white' : 'rgba(255,255,255,0.4)',
                  }}
                />
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

// ─── QuickActions ─────────────────────────────────────────────────────────────
function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View className="bg-white rounded-3xl p-5 shadow-sm elevation-2 border border-slate-100">
      <View className="flex-row flex-wrap">
        {actions.map((item, idx) => (
          <View
            key={item.key}
            className="w-1/4 items-center"
            style={{ marginBottom: idx < actions.length - 4 ? 24 : 0 }}
          >
            <Pressable
              onPress={item.onPress}
              style={({ pressed }) => ({
                backgroundColor: item.bg,
                opacity: pressed ? 0.85 : 1,
              })}
              className="w-14 h-14 rounded-2xl items-center justify-center"
            >
              <MaterialIcons
                name={item.iconName as any}
                size={26}
                color={item.color}
              />
            </Pressable>
            <Text className="text-[10px] font-bold text-gray-800 text-center mt-2 leading-tight">
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3.5">
      <Text className="text-[17px] font-bold text-gray-800">{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text className="text-secondary text-sm font-semibold">Xem tất cả</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── FacilityCard ─────────────────────────────────────────────────────────────
function FacilityCard({ item }: { item: Facility }) {
  return (
    <Pressable
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      className="w-[152px] bg-white p-3 rounded-[18px] border border-slate-100 shadow-sm elevation-1"
    >
      <View className="w-24 h-24 rounded-xl bg-slate-50 overflow-hidden self-center mb-2.5">
        <Image
          source={{ uri: item.logo }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <Text
        className="text-sm font-bold text-gray-800 leading-[18px]"
        numberOfLines={2}
      >
        {item.name}
      </Text>
      <Text className="text-[11px] text-gray-500 mt-1 mb-1.5" numberOfLines={1}>
        {item.address}
      </Text>

      <View className="flex-row items-center justify-between mt-auto">
        <View
          style={{ backgroundColor: item.typeBg }}
          className="rounded-md px-1.5 py-0.5"
        >
          <Text style={{ color: item.typeColor }} className="text-[9px] font-semibold">
            {item.type}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Static news data ─────────────────────────────────────────────────────────
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

// ─── SpecialtyGrid ────────────────────────────────────────────────────────────
function SpecialtyGrid({ items }: { items: string[] }) {
  const getSpecialtyConfig = (specialty: string) => {
    switch (specialty) {
      case 'Pulmonology':
        return { label: 'Hô hấp', icon: 'lungs', color: theme.colors.primary, bg: '#EFF6FF' };
      case 'Thoracic Surgery':
        return { label: 'Phẫu thuật lồng ngực', icon: 'heart-pulse', color: theme.colors.secondary, bg: '#F0FDF4' };
      case 'Respiratory Medicine':
        return { label: 'Nội khoa hô hấp', icon: 'stethoscope', color: '#4F46E5', bg: '#EEF2FF' };
      case 'Tuberculosis':
        return { label: 'Lao phổi', icon: 'virus', color: '#EF4444', bg: '#FEF2F2' };
      default:
        return { label: specialty, icon: 'medical-bag', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  return (
    <View className="flex-row flex-wrap gap-4">
      {items.slice(0, 4).map((s) => {
        const { label, icon, color, bg } = getSpecialtyConfig(s);
        return (
          <Pressable key={s} className="items-center gap-1.5 w-16">
            <View
              style={{ backgroundColor: bg }}
              className="w-14 h-14 rounded-2xl items-center justify-center"
            >
              <MaterialCommunityIcons name={icon as any} size={34} color={color} />
            </View>
            <Text
              className="text-[10px] font-medium text-gray-500 text-center"
              numberOfLines={2}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────
function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Pressable
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      className="w-60 bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm elevation-1"
    >
      <View className="h-32 relative overflow-hidden rounded-t-[18px]">
        <Image
          source={{ uri: item.image }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {item.badge && (
          <View className="absolute top-2 left-2 bg-blue-600/90 rounded-lg px-2 py-1">
            <Text className="text-white text-[10px] font-bold">{item.badge}</Text>
          </View>
        )}
      </View>
      <View className="p-3.5">
        <Text
          className="text-sm font-bold text-gray-800 leading-[18px] mb-2"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="calendar-today" size={13} color="#94A3B8" />
          <Text className="text-[11px] text-slate-400">{item.date}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const doctorsQuery = usePublicDoctors({ page: 1, limit: 4 });
  const hospitalsQuery = useHospitals({ page: 1, limit: 4 });
  const specialtiesQuery = useSpecialties();

  const QUICK_ACTIONS: QuickAction[] = [
    {
      key: 'doctors',
      label: 'Đặt khám\nbác sĩ',
      iconName: 'person-search',
      iconLib: 'material',
      color: theme.colors.primary,
      bg: '#EFF6FF',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'clinic',
      label: 'Phòng\nkhám',
      iconName: 'local-hospital',
      iconLib: 'material',
      color: theme.colors.secondary,
      bg: '#F0FDF4',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'hospital',
      label: 'Bệnh\nviện',
      iconName: 'apartment',
      iconLib: 'material',
      color: theme.colors.primary,
      bg: '#EFF6FF',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'ai',
      label: 'Phân tích\nAI',
      iconName: 'center-focus-strong',
      iconLib: 'material',
      color: '#4F46E5',
      bg: '#EEF2FF',
      onPress: () => router.push('/(tabs)/ai'),
    },
    {
      key: 'chat',
      label: 'Chat\nbác sĩ',
      iconName: 'chat-bubble',
      iconLib: 'material',
      color: theme.colors.secondary,
      bg: '#F0FDF4',
      onPress: () => router.push('/(tabs)/notifications'),
    },
    {
      key: 'video',
      label: 'Video\ncall',
      iconName: 'videocam',
      iconLib: 'material',
      color: theme.colors.primary,
      bg: '#EFF6FF',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'records',
      label: 'Hồ sơ\nsức khỏe',
      iconName: 'assignment',
      iconLib: 'material',
      color: theme.colors.secondary,
      bg: '#F0FDF4',
      onPress: () => router.push('/medical-records'),
    },
    {
      key: 'news',
      label: 'Tin\ntức',
      iconName: 'article',
      iconLib: 'material',
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
    <ScrollView
      className="flex-1 bg-slate-50"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Header />

      <View className="px-4 pt-11 gap-6">
        {/* ── Promo Banner ── */}
        <PromoBanner />

        {/* ── Quick Actions ── */}
        <QuickActions actions={QUICK_ACTIONS} />

        {/* ── Featured Doctors ── */}
        <View>
          <SectionHeader
            title="Bác sĩ nổi bật"
            onSeeAll={() => router.push('/doctors')}
          />
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

        {/* ── Medical Facilities ── */}
        <View>
          <SectionHeader
            title="Cơ sở y tế"
            onSeeAll={() => router.push('/hospitals' as any)}
          />
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
                    key={h.id}
                    item={{
                      id: h.id,
                      name: h.name,
                      address: h.address,
                      type: isClinic ? 'Phòng khám' : 'Bệnh viện',
                      distance: '2.5 km',
                      logo: h.logoUrl || 'https://cdn-icons-png.flaticon.com/512/3063/3063206.png',
                      typeColor: isClinic ? theme.colors.secondary : theme.colors.primary,
                      typeBg: isClinic ? '#F0FDF4' : '#EFF6FF',
                    }}
                  />
                );
              }}
            />
          )}
        </View>

        {/* ── Specialties ── */}
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

        {/* ── Medical News ── */}
        <View className="pb-8">
          <SectionHeader
            title="Tin tức y khoa"
            onSeeAll={() => router.push('/news' as any)}
          />
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