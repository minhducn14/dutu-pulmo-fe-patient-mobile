import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { theme } from '@/constants/theme';
import { useCreateReview } from '@/hooks/useReviews';
import { useAppointmentDetail } from '@/hooks/useAppointments';

export function CreateReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const appointmentQuery = useAppointmentDetail(appointmentId ?? '');
  const createReview = useCreateReview();

  const handleRating = (r: number) => setRating(r);

  const handleSubmit = () => {
    if (!appointmentId || !appointmentQuery.data?.doctor?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin cuộc hẹn.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đánh giá của bạn.');
      return;
    }

    createReview.mutate(
      {
        doctorId: appointmentQuery.data?.doctor?.id,
        appointmentId,
        rating,
        comment,
        isAnonymous,
      },
      {
        onSuccess: () => {
          Alert.alert('Thành công', 'Cảm ơn bạn đã gửi đánh giá!');
          router.back();
        },
        onError: (error: any) => {
          Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
        },
      }
    );
  };

  const doctor = appointmentQuery.data?.doctor;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      className="flex-1 bg-white"
    >
      <ScreenHeader title="Đánh giá bác sĩ" onBack={() => router.back()} />
      
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="items-center mb-8">
          <Text className="text-lg font-bold text-gray-900 text-center">
            Bạn thấy thế nào về dịch vụ của
          </Text>
          <Text className="text-lg font-bold text-blue-600 text-center">
            {doctor?.fullName || 'Bác sĩ'}?
          </Text>
          
          <View className="flex-row gap-2 mt-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => handleRating(s)}>
                <MaterialIcons
                  name={s <= rating ? 'star' : 'star-outline'}
                  size={48}
                  color={s <= rating ? '#FBBF24' : '#CBD5E1'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text className="mt-2 text-sm text-gray-500 font-medium">
            {rating === 5 ? 'Rất hài lòng' : rating === 4 ? 'Hài lòng' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Không hài lòng' : 'Rất tệ'}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-bold text-gray-700 mb-2 px-1">Nhận xét của bạn</Text>
          <TextInput
            className="bg-gray-50 rounded-2xl p-4 text-gray-900 text-sm min-h-[120px] border border-gray-100"
            placeholder="Chia sẻ trải nghiệm của bạn về bác sĩ và phòng khám..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
          />
        </View>

        {/* <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-2xl mb-10">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-bold text-gray-900">Đánh giá ẩn danh</Text>
            <Text className="text-xs text-gray-500 mt-0.5">Tên của bạn sẽ không được hiển thị</Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
            thumbColor={isAnonymous ? '#2563EB' : '#F8FAFC'}
          />
        </View> */}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createReview.isPending}
          className={`py-4 rounded-2xl items-center shadow-lg ${createReview.isPending ? 'bg-blue-300' : 'bg-blue-600'}`}
          style={{ shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
        >
          <Text className="text-white font-bold text-base">
            {createReview.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Text>
        </TouchableOpacity>
        
        <View style={{ height: Math.max(insets.bottom, 24) }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default CreateReviewScreen;
