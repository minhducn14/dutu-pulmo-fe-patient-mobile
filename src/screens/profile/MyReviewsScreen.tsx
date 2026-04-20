import React from 'react';
import { View, FlatList, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReviewItem } from '@/components/review/ReviewItem';
import { useMyReviews, useDeleteReview } from '@/hooks/useReviews';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { Alert, Image } from 'react-native';
import { theme } from '@/constants/theme';

export function MyReviewsScreen() {
  const router = useRouter();
  const { data: reviews, isLoading, isError, refetch } = useMyReviews();
  const deleteReview = useDeleteReview();
  console.log("reviews: ",reviews);

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await refetch();
  });
  const handleDelete = (id: string) => {
    Alert.alert(
      'Xóa đánh giá',
      'Bạn có chắc chắn muốn xóa đánh giá này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => deleteReview.mutate(id)
        },
      ]
    );
  };

  if (isLoading) return <Loading label="Đang tải đánh giá của bạn..." />;

  if (isError) {
    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title="Đánh giá của tôi" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-4">
          <EmptyState 
            title="Có lỗi xảy ra" 
            description="Không thể tải danh sách đánh giá." 
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View
        className="bg-primary pb-4"
        style={{
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <ScreenHeader title="Đánh giá của tôi" onBack={() => router.back()} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View
            className="mb-4 overflow-hidden rounded-2xl bg-white"
            style={theme.shadow.card}
          >
            {/* Review Header: Doctor Info */}
            <View className="flex-row items-center justify-between border-b border-slate-50 bg-slate-50/50 px-4 py-3">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                  {item.doctorAvatar ? (
                    <Image
                      source={{ uri: item.doctorAvatar }}
                      className="h-9 w-9 rounded-full"
                    />
                  ) : (
                    <MaterialIcons name="person" size={20} color={theme.colors.primary} />
                  )}
                </View>
                <View>
                  <Text className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Bác sĩ
                  </Text>
                  <Text className="text-[14px] font-bold text-slate-900">
                    {item.doctorName || 'N/A'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                className="h-8 w-8 items-center justify-center rounded-full bg-red-50"
              >
                <MaterialIcons name="delete-outline" size={18} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>

            {/* Review Content */}
            <View className="px-4 pb-1">
              <ReviewItem review={item} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="mt-20 items-center justify-center px-8">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-slate-100">
              <MaterialIcons name="rate-review" size={48} color={theme.colors.textMuted} />
            </View>
            <Text className="text-base font-bold text-slate-800">Chưa có đánh giá</Text>
            <Text className="mt-2 text-center text-sm text-slate-400">
              Bạn chưa thực hiện đánh giá cho bác sĩ nào.
            </Text>
          </View>
        }
      />
    </View>
  );
}
