import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  useWindowDimensions,
  Share,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import RenderHtml from 'react-native-render-html';
import { SAMPLE_NEWS, NEWS_CATEGORIES } from '@/constants/news-data';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const news = useMemo(() => SAMPLE_NEWS.find((n) => n.id === id), [id]);

  if (!news) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <MaterialIcons name="error-outline" size={64} color="#CBD5E1" />
        <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '700', color: '#1E293B' }}>
          Không tìm thấy bài viết
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            backgroundColor: '#0A7CFF',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const catInfo = NEWS_CATEGORIES.find((c) => c.value === news.category);

  const onShare = async () => {
    try {
      await Share.share({
        message: `${news.title}\n\nĐọc thêm tại Dutu Pulmo: ${news.description}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack.Screen
        options={{
          headerTitle: 'Chi tiết tin tức',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'white' },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
              <MaterialIcons name="arrow-back-ios" size={20} color="#1F2937" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={onShare} style={{ padding: 8, marginRight: -8 }}>
              <MaterialIcons name="share" size={22} color="#1F2937" />
            </Pressable>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: news.image }}
          style={{ width: '100%', height: 240 }}
          resizeMode="cover"
        />

        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View
              style={{
                backgroundColor: '#F1F5F9',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: catInfo?.color || '#1E293B', fontSize: 11, fontWeight: '800' }}>
                {catInfo?.label.toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: '500' }}>
              {news.date}
            </Text>
          </View>

          <Text style={{ fontSize: 24, fontWeight: '900', color: '#1E293B', lineHeight: 32, marginBottom: 16 }}>
            {news.title}
          </Text>

          <View
            style={{
              paddingLeft: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#E2E8F0',
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 16, color: '#64748B', fontStyle: 'italic', lineHeight: 24 }}>
              {news.description}
            </Text>
          </View>

          <RenderHtml
            contentWidth={width - 40}
            source={{ html: news.content }}
            tagsStyles={{
              p: {
                fontSize: 15,
                lineHeight: 24,
                color: '#334155',
                marginBottom: 16,
              },
              strong: {
                fontWeight: '700',
                color: '#1E293B',
              },
              li: {
                fontSize: 15,
                lineHeight: 24,
                color: '#334155',
                marginBottom: 8,
              },
              ul: {
                marginBottom: 16,
              },
              ol: {
                marginBottom: 16,
              },
            }}
          />
        </View>

        {/* Support Section */}
        <View style={{ margin: 20, padding: 20, backgroundColor: '#F0F9FF', borderRadius: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0C4A6E', marginBottom: 8 }}>
            Cần hỗ trợ y tế?
          </Text>
          <Text style={{ fontSize: 13, color: '#0369A1', lineHeight: 20, marginBottom: 16 }}>
            Nếu bạn gặp bất kỳ vấn đề nào về sức khỏe hệ hô hấp, đừng ngần ngại liên hệ với chúng tôi.
          </Text>
          <Pressable
            onPress={() => router.push('/support')}
            style={{
              backgroundColor: '#0A7CFF',
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Liên hệ ngay</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
