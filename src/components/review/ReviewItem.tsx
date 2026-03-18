import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import type { ReviewResponseDto } from '@/types/review.types';
import { theme } from '@/constants/theme';

interface ReviewItemProps {
  review: ReviewResponseDto;
}

export function ReviewItem({ review }: ReviewItemProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <MaterialIcons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={14}
        color="#FBBF24"
      />
    ));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <View className="py-4 last:border-0">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Avatar size={32} uri={review.reviewerAvatar} />
          <View>
            <Text className="text-sm font-bold text-slate-900">
              {review.isAnonymous ? 'Người dùng ẩn danh' : review.reviewerName}
            </Text>
            <Text className="text-[10px] text-slate-400">
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-0.5">{renderStars(review.rating)}</View>
      </View>

      <Text className="mt-2 text-[14px] leading-relaxed text-slate-600">
        {review.comment}
      </Text>

      {review.doctorResponse && (
        <View className="mt-3 rounded-xl bg-slate-50/80 p-3 border border-slate-100">
          <View className="flex-row items-center gap-1.5 mb-1">
            <MaterialIcons name="reply" size={14} color={theme.colors.primary} />
            <Text className="text-[11px] font-extrabold text-blue-600 uppercase tracking-tighter">
              Phản hồi từ bác sĩ
            </Text>
          </View>
          <Text className="text-[13px] text-slate-600 leading-relaxed font-medium">
            {review.doctorResponse}
          </Text>
        </View>
      )}
    </View>
  );
}
