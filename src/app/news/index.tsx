import React, { useState, useMemo } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter } from 'expo-router';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SAMPLE_NEWS, NEWS_CATEGORIES, NewsCategory } from '@/constants/news-data';

export default function NewsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const filteredNews = useMemo(() => {
    return SAMPLE_NEWS.filter((item) => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  const handleNewsPress = (id: string) => {
    router.push(`/news/${id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Stack.Screen
        options={{
          headerTitle: 'Tin tức y khoa',
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

      <View style={{ backgroundColor: 'white', paddingBottom: 12 }}>
        {/* Search Bar */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F1F5F9',
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <MaterialIcons name="search" size={20} color="#64748B" />
            <TextInput
              placeholder="Tìm kiếm tin tức..."
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: '#1E293B' }}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')}>
                <MaterialIcons name="cancel" size={18} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Categories Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          <Pressable
            onPress={() => setSelectedCategory('ALL')}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: selectedCategory === 'ALL' ? '#0A7CFF' : '#F1F5F9',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: selectedCategory === 'ALL' ? 'white' : '#64748B',
              }}
            >
              Tất cả
            </Text>
          </Pressable>
          {NEWS_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.value}
              onPress={() => setSelectedCategory(cat.value)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: selectedCategory === cat.value ? '#0A7CFF' : '#F1F5F9',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: selectedCategory === cat.value ? 'white' : '#64748B',
                }}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredNews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <MaterialIcons name="search-off" size={64} color="#CBD5E1" />
            <Text style={{ marginTop: 16, color: '#64748B', fontSize: 15 }}>
              Không tìm thấy bài viết nào
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const catInfo = NEWS_CATEGORIES.find((c) => c.value === item.category);
          return (
            <Pressable
              onPress={() => handleNewsPress(item.id)}
              style={({ pressed }) => ({
                backgroundColor: 'white',
                borderRadius: 24,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#F1F5F9',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 2,
                opacity: pressed ? 0.95 : 1,
              })}
            >
              <View style={{ height: 160 }}>
                <Image
                  source={{ uri: item.image }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  {item.badge ? (
                    <View
                      style={{
                        backgroundColor: '#EF4444',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>
                        {item.badge.toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: catInfo?.color || '#1E293B',
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      {catInfo?.label.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: '#1E293B',
                    lineHeight: 22,
                    marginBottom: 8,
                  }}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: '#64748B',
                    lineHeight: 18,
                    marginBottom: 16,
                  }}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="schedule" size={14} color="#94A3B8" />
                    <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500' }}>
                      {item.date}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#0A7CFF', fontWeight: '700' }}>
                    Chi tiết →
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
