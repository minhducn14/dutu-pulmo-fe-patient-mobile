import { Stack, useRouter } from 'expo-router';
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Reuse mock data for now
const today = new Date().toLocaleDateString('vi-VN');
const NEWS = [
  {
    id: '1',
    title: 'Cách bảo vệ phổi hiệu quả trong mùa ô nhiễm',
    date: today,
    badge: 'Nổi bật',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_iLiX96-7KdxD4YhY0FSz0j7UjUIwRaf_hijFJXoGnoU0IKtsM5oAaEYSD5faycH9y8oNIauP5l9PXYxdsY8BgA76M9mLZJ8ee-3zNiE5svEEj9YwZ2w1qWdc7fqr3OPfkX5dkfXBaLvlobTs2n7EgUxU2vrO2z08OQ7LYxOz-yk62p01ISci48F58PYinPutu76l38sDmsdKyYvzADcFQ5Ir61f-_9CilNd2SDQQ-joUrGyreyvry5R-zRH__G7ns7a-0x5bTuPF',
  },
  {
    id: '2',
    title: '5 loại thực phẩm "vàng" giúp thanh lọc phổi',
    date: today,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuT8PX4pCe44kEMMhyHmWX_Lu8fVS07PKoL9Mlcj-hpq61iUxwNd0HtAGHEpSvERiEDZx2SOGC2ux-14VEWoRQ3QTtXbX1hb_XROkDVvUjJXMCmnFCbrjerRmFIQONHmn4kVqrmJZh_3HXTwJAxAG7TZxYakAAW57D-mE4oazGNsaBRcMWZKAgsWK463Z130Kp86aTSo1SGa5mMMjzFcezqP5lQ_KuTh7i5bSDiVXI30RnFv_VOhvhjHcfENOSRCgzy7vslHqkek-e',
  },
  {
    id: '3',
    title: 'Tầm soát ung thư phổi: Khi nào cần thực hiện?',
    date: today,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Z35PMEKVy1oCowwCra6qNghyrapFVbSjVECe3cNKjl9gZJHbC4gWSbILWcIonzWzC2L-dgPNFoAVbfFQj8SIDoprB3jEKaqmVyP6_DkfYIAuSHJxPiThA1CjgGDL1vIkDu8l4o0VvJbY1M-7mGIRoFs5AbQiuFe9F8eVabNuGTYVUXVKT5QW0pmOXYzTKTwkDUyGpEZGa_xZ-2_an9chkmWtjg9hPXGNeXRmlFf3hHtS1ahwIv5dJKZmRNMlXphQUS7w_KvcyEMB',
  },
];

export default function NewsScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Stack.Screen
        options={{
          title: 'Tin tức y khoa',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'white' },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
              <MaterialIcons name="arrow-back-ios" size={20} color="#1F2937" />
            </Pressable>
          ),
        }}
      />
      <View style={{ flex: 1 }}>
        <FlatList
          data={NEWS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => ({
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
              <View style={{ height: 180, position: 'relative' }}>
                <Image
                  source={{ uri: item.image }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                {item.badge && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      backgroundColor: '#EF4444',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>
                      {item.badge}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: '#1F2937',
                    lineHeight: 22,
                    marginBottom: 12,
                  }}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="calendar-today" size={14} color="#94A3B8" />
                  <Text style={{ fontSize: 12, color: '#94A3B8' }}>{item.date}</Text>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginHorizontal: 4 }} />
                  <Text style={{ fontSize: 12, color: '#0A7CFF', fontWeight: '500' }}>Đọc tiếp</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}
