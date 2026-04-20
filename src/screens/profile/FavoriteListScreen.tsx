import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, Image, RefreshControl } from 'react-native';

import { Loading } from '@/components/ui/Loading';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { theme } from '@/constants/theme';

type TabType = 'doctors' | 'hospitals';

export function FavoriteListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('doctors');
  const { data: favorites, isLoading, refetch } = useFavorites();
  const removeFavorite = useRemoveFavorite();

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await refetch();
  });

  const filteredFavorites = favorites?.filter((f) =>
    activeTab === 'doctors' ? !!f.doctorId : !!f.hospitalId
  ) || [];

  const handlePressItem = (item: any) => {
    if (activeTab === 'doctors') {
      router.push(`/doctors/${item.doctorId}`);
    } else {
      router.push(`/hospitals/${item.hospitalId}`);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const data = activeTab === 'doctors' ? item.doctor : item.hospital;
    if (!data) return null;

    const title = activeTab === 'doctors' ? data.fullName : data.name;
    const subtitle = activeTab === 'doctors' ? data.specialty : data.address;
    const imageUrl = activeTab === 'doctors' ? data.avatarUrl : data.logoUrl;

    return (
      <TouchableOpacity
        onPress={() => handlePressItem(item)}
        activeOpacity={0.7}
        className="mx-4 mb-4 flex-row items-center bg-white p-4 rounded-2xl"
        style={theme.shadow.card}
      >
        <Image
          source={{ uri: imageUrl || 'https://via.placeholder.com/150' }}
          className="h-14 w-14 rounded-2xl bg-slate-50"
        />
        <View className="ml-4 flex-1">
          <Text className="text-[15px] font-bold text-slate-900" numberOfLines={1}>
            {title}
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <MaterialIcons
              name={activeTab === 'doctors' ? 'medical-services' : 'location-on'}
              size={12}
              color={theme.colors.textMuted}
            />
            <Text className="text-[13px] text-slate-500" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => removeFavorite.mutate(item.id)}
          className="h-9 w-9 items-center justify-center rounded-full bg-red-50"
        >
          <MaterialIcons name="favorite" size={18} color={theme.colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View
        className="bg-primary pb-6"
        style={{
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <ScreenHeader title="Yêu thích" onBack={() => router.back()} />

        {/* Pill-style Tabs */}
        <View className="mx-4 mt-2 flex-row rounded-xl bg-white/20 p-1">
          {(['doctors', 'hospitals'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5 ${
                activeTab === tab ? 'bg-white' : ''
              }`}
            >
              <MaterialIcons
                name={tab === 'doctors' ? 'person' : 'local-hospital'}
                size={16}
                color={activeTab === tab ? theme.colors.primary : 'white'}
              />
              <Text
                className={`text-[13px] font-bold ${
                  activeTab === tab ? 'text-primary' : 'text-white'
                }`}
              >
                {tab === 'doctors' ? 'Bác sĩ' : 'Bệnh viện'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <Loading label="Đang tải danh sách..." />
      ) : filteredFavorites.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-slate-100">
            <MaterialIcons
              name={activeTab === 'doctors' ? 'person-outline' : 'apartment'}
              size={48}
              color={theme.colors.textMuted}
            />
          </View>
          <Text className="text-base font-bold text-slate-800">
            Trống
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-400">
            Bạn chưa có {activeTab === 'doctors' ? 'bác sĩ' : 'bệnh viện'} yêu thích nào.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFavorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

export default FavoriteListScreen;
