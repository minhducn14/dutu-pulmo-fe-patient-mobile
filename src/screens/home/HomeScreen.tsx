import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Loading } from '@/components/ui/Loading';
import { useAuthStore } from '@/store/auth.store';
import { usePublicDoctors, useSpecialties } from '@/hooks/useAppointments';
import { useHospitals } from '@/hooks/useHospitals';

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
    <View
      style={{
        width: 96,
        height: 96,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 10,
        backgroundColor: '#F1F5F9',
        alignSelf: 'center',
      }}
    >
      {showImage ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#DBEAFE',
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#0A7CFF' }}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

function Header() {
  const { user } = useAuthStore();
  const currentHour = new Date().getHours();
  let greeting = 'Chào buổi tối!';
  if (currentHour < 12) greeting = 'Chào buổi sáng!';
  else if (currentHour < 18) greeting = 'Chào buổi chiều!';

  return (
    <View
      style={{
        backgroundColor: '#0A7CFF',
        paddingTop: 52,
        paddingBottom: 56,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
      }}
    >
      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        {/* Logo + User */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Logo */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingRight: 12,
              borderRightWidth: 1,
              borderRightColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: 'white',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Image
                source={require('@/assets/images/logo.jpg')}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text
                style={{
                  color: 'white',
                  fontWeight: '700',
                  fontSize: 16,
                  lineHeight: 18,
                }}
              >
                Dutu
              </Text>
              <Text
                style={{
                  color: '#22C55E',
                  fontWeight: '700',
                  fontSize: 16,
                  lineHeight: 18,
                }}
              >
                Pulmo
              </Text>
            </View>
          </View>

          {/* User */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingLeft: 4,
            }}
          >
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlsQ3DvfFlr_UgmmwE9It1YpLX8WBOWH06ZQqHysA90z-joKXMu4MZhrbe-cPkp1V9u1uEhXXfEPBL7Tw7C_c9xGTQuY7Del_d-yQpoVNHAWTxYvVf_MiAbNF-0SRxRH6OYRq3__dNi_pR5fBRRP56xt_RP7yrMgDkOqmh8vE5v2PhHBBf4GzodYp-JO5RVpHaBQhDZSlh9X3BTCHvX3U2i-IFMBYoQT626xH4aUrD9qM7q6tlAywfRcibQz5e0bG6lIEveyWKPEFJ',
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}
            />
            <View>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 11,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {greeting}
              </Text>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                {user?.fullName || 'Khách'}
              </Text>
            </View>
          </View>
        </View>

        {/* Notification */}
        <View style={{ position: 'relative' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="notifications" size={22} color="white" />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#EF4444',
              borderWidth: 2,
              borderColor: '#0A7CFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 9, fontWeight: '700' }}>
              4
            </Text>
          </View>
        </View>
      </View>

      {/* Search bar — floats below the header */}
      <View
        style={{
          position: 'absolute',
          bottom: -26,
          left: 16,
          right: 16,
          backgroundColor: 'white',
          borderRadius: 16,
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <MaterialIcons
          name="search"
          size={22}
          color="#94A3B8"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Tìm bác sĩ, chuyên khoa, bệnh viện..."
          placeholderTextColor="#94A3B8"
          style={{ flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '500' }}
        />
      </View>
    </View>
  );
}

function PromoBanner() {
  return (
    <View
      style={{
        height: 168,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Image
        source={{
          uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYxDTSa51LrRLJsK4BTzCss1JQTQgnOsX1g-rO51r4EYTNrOScpK4-yHLycKeck2A6sz5r7eNc0zjmL6YNawHTzluXZGmE2iF9frPWZ4p9kcR1nQtCJa5iXD1j5AdfyQ-kdLYVVl7Q55GNFCe54ayCKMrqWkDVBL98PLgbXttWefV2WKqsVIxEcdTPXyx1lU-p3g49wDyuH2l2ued3MBzemwNuXJMYR1NqSTZDQNsh4yFkPQDZF9yKfBr5LsZh7EH831C-k0gKAo0m',
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
        resizeMode="cover"
      />
      {/* Gradient overlay */}
      <View
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(10,124,255,0.85)',
        }}
      />
      {/* Left green accent bar */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 5,
          backgroundColor: '#22C55E',
        }}
      />

      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 20,
          justifyContent: 'center',
          right: 16,
        }}
      >
        {/* Badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              CHĂM SÓC TOÀN DIỆN
            </Text>
          </View>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#22C55E',
            }}
          />
        </View>

        <Text
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: '700',
            lineHeight: 26,
            marginBottom: 16,
          }}
        >
          Chăm sóc sức khỏe{'\n'}phổi toàn diện
        </Text>

        <Pressable
          style={({ pressed }) => ({
            backgroundColor: '#22C55E',
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 10,
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>
            Khám phá ngay
          </Text>
          <MaterialIcons name="arrow-forward" size={16} color="white" />
        </Pressable>
      </View>

      {/* Pagination dots */}
      <View
        style={{
          position: 'absolute',
          bottom: 12,
          right: 16,
          flexDirection: 'row',
          gap: 5,
        }}
      >
        <View
          style={{
            width: 18,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'white',
          }}
        />
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.4)',
          }}
        />
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.4)',
          }}
        />
      </View>
    </View>
  );
}

function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 0 }}>
        {actions.map((item, idx) => (
          <View
            key={item.key}
            style={{
              width: '25%',
              alignItems: 'center',
              marginBottom: idx < actions.length - 4 ? 24 : 0,
            }}
          >
            <Pressable
              onPress={item.onPress}
              style={({ pressed }) => ({
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: item.bg,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <MaterialIcons
                name={item.iconName as any}
                size={26}
                color={item.color}
              />
            </Pressable>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: '#1F2937',
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 13,
              }}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}
    >
      <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F2937' }}>
        {title}
      </Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text style={{ color: '#22C55E', fontSize: 13, fontWeight: '600' }}>
            Xem tất cả
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function FacilityCard({ item }: { item: Facility }) {
  return (
    <Pressable
      style={({ pressed }) => ({
        width: 152,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 18,
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
          width: 96,
          height: 96,
          borderRadius: 12,
          backgroundColor: '#F8FAFC',
          overflow: 'hidden',
          alignSelf: 'center',
          marginBottom: 10,
        }}
      >
        <Image
          source={{ uri: item.logo }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: '#1F2937',
          lineHeight: 18,
        }}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: '#6B7280',
          marginTop: 4,
          marginBottom: 6,
        }}
        numberOfLines={1}
      >
        {item.address}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
        }}
      >
        <View
          style={{
            backgroundColor: item.typeBg,
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{ fontSize: 9, color: item.typeColor, fontWeight: '600' }}
          >
            {item.type}
          </Text>
        </View>
        {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <MaterialIcons name="near-me" size={10} color="#94A3B8" />
          <Text style={{ fontSize: 9, color: '#94A3B8' }}>{item.distance}</Text>
        </View> */}
      </View>
    </Pressable>
  );
}

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

function SpecialtyGrid({ items }: { items: string[] }) {
  const getSpecialtyConfig = (specialty: string) => {
    switch (specialty) {
      case 'Pulmonology':
        return {
          label: 'Hô hấp',
          icon: 'lungs',
          color: '#0A7CFF',
          bg: '#EFF6FF',
        };
      case 'Thoracic Surgery':
        return {
          label: 'Phẫu thuật lồng ngực',
          icon: 'heart-pulse',
          color: '#22C55E',
          bg: '#F0FDF4',
        };
      case 'Respiratory Medicine':
        return {
          label: 'Nội khoa hô hấp',
          icon: 'stethoscope',
          color: '#4F46E5',
          bg: '#EEF2FF',
        };
      case 'Tuberculosis':
        return {
          label: 'Lao phổi',
          icon: 'virus',
          color: '#EF4444',
          bg: '#FEF2F2',
        };
      default:
        return {
          label: specialty,
          icon: 'medical-bag',
          color: '#6B7280',
          bg: '#F3F4F6',
        };
    }
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {items.slice(0, 4).map((s) => {
        const { label, icon, color, bg } = getSpecialtyConfig(s);
        return (
          <Pressable
            key={s}
            style={{ alignItems: 'center', gap: 6, width: 64 }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={34}
                color={color}
              />
            </View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '500',
                color: '#6B7280',
                textAlign: 'center',
              }}
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

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Pressable
      style={({ pressed }) => ({
        width: 240,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ height: 130, position: 'relative', overflow: 'hidden', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
        <Image
          source={{ uri: item.image }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {item.badge && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'rgba(10,124,255,0.9)',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>
              {item.badge}
            </Text>
          </View>
        )}
      </View>
      <View style={{ padding: 14 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: '#1F2937',
            lineHeight: 18,
            marginBottom: 8,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MaterialIcons name="calendar-today" size={13} color="#94A3B8" />
          <Text style={{ fontSize: 11, color: '#94A3B8' }}>{item.date}</Text>
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
      color: '#0A7CFF',
      bg: '#EFF6FF',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'clinic',
      label: 'Phòng\nkhám',
      iconName: 'local-hospital',
      iconLib: 'material',
      color: '#22C55E',
      bg: '#F0FDF4',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'hospital',
      label: 'Bệnh\nviện',
      iconName: 'apartment',
      iconLib: 'material',
      color: '#0A7CFF',
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
      color: '#22C55E',
      bg: '#F0FDF4',
      onPress: () => router.push('/(tabs)/notifications'),
    },
    {
      key: 'video',
      label: 'Video\ncall',
      iconName: 'videocam',
      iconLib: 'material',
      color: '#0A7CFF',
      bg: '#EFF6FF',
      onPress: () => router.push('/doctors'),
    },
    {
      key: 'records',
      label: 'Hồ sơ\nsức khỏe',
      iconName: 'assignment',
      iconLib: 'material',
      color: '#22C55E',
      bg: '#F0FDF4',
      onPress: () => router.push('/medical-records'),
    },
    {
      key: 'news',
      label: 'Tin\ntức',
      iconName: 'article',
      iconLib: 'material',
      color: '#0A7CFF',
      bg: '#EFF6FF',
      onPress: () => router.push('/settings'),
    },
  ];

  if (doctorsQuery.isLoading) return <Loading label="Đang tải..." />;
  if (doctorsQuery.isError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          paddingHorizontal: 24,
        }}
      >
        <MaterialIcons name="wifi-off" size={48} color="#CBD5E1" />
        <Text
          style={{
            color: '#94A3B8',
            fontSize: 14,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Không thể tải dữ liệu. Vui lòng thử lại sau.
        </Text>
      </View>
    );
  }

  const doctors = doctorsQuery.data?.items ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Header />

      <View style={{ paddingHorizontal: 16, paddingTop: 44, gap: 24 }}>
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
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <MaterialIcons name="person-search" size={36} color="#CBD5E1" />
              <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8 }}>
                Chưa có dữ liệu bác sĩ
              </Text>
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
                  style={({ pressed }) => ({
                    width: 152,
                    backgroundColor: 'white',
                    padding: 12,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 1,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <DoctorAvatar
                    avatarUrl={doctor.avatarUrl}
                    name={doctor.fullName}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#1F2937',
                    }}
                    numberOfLines={1}
                  >
                    {doctor.fullName || 'Bác sĩ'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: '#6B7280',
                      marginTop: 2,
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {doctor.specialty || 'Hô hấp'}
                  </Text>
                  {!!doctor.yearsOfExperience && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: '#94A3B8',
                        marginBottom: 4,
                      }}
                    >
                      {doctor.yearsOfExperience} năm KN
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <MaterialIcons name="star" size={14} color="#FBBF24" />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: '#1F2937',
                      }}
                    >
                      {parseFloat((doctor as any).averageRating ?? '0').toFixed(
                        1,
                      )}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>
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
            onSeeAll={() => router.push('/doctors')}
          />
          {hospitalsQuery.isLoading ? (
            <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8 }}>
              Đang tải dữ liệu...
            </Text>
          ) : hospitalsQuery.isError ? (
            <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8 }}>
              Không thể tải dữ liệu cơ sở y tế
            </Text>
          ) : !hospitalsQuery.data?.items?.length ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <MaterialIcons name="apartment" size={36} color="#CBD5E1" />
              <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8 }}>
                Chưa có dữ liệu cơ sở y tế
              </Text>
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
                      logo:
                        h.logoUrl ||
                        'https://cdn-icons-png.flaticon.com/512/3063/3063206.png',
                      typeColor: isClinic ? '#22C55E' : '#0A7CFF',
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
            onSeeAll={() => router.push('/doctors')}
          />
          {specialtiesQuery.isLoading ? (
            <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8 }}>
              Đang tải...
            </Text>
          ) : (
            <SpecialtyGrid items={specialtiesQuery.data || []} />
          )}
        </View>

        {/* ── Medical News ── */}
        <View style={{ paddingBottom: 32 }}>
          <SectionHeader
            title="Tin tức y khoa"
            onSeeAll={() => router.push('/settings')}
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
