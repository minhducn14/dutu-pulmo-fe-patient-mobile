import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Input } from '@/components/ui/Input';
import { useUpdatePassword } from '@/hooks/useUpdatePassword';

export function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const updatePasswordMutation = useUpdatePassword();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!oldPassword) {
      newErrors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      newErrors.newPassword = 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = () => {
    if (!validate()) return;

    updatePasswordMutation.mutate(
      { oldPassword, newPassword, confirmPassword },
      {
        onSuccess: () => {
          Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || 'Đổi mật khẩu thất bại';
          Alert.alert('Lỗi', typeof message === 'string' ? message : 'Có lỗi xảy ra');
        },
      },
    );
  };

  const isPending = updatePasswordMutation.isPending;

  return (
    <View className="flex-1 bg-slate-50">
      <View 
        className="flex-row items-center gap-3 bg-blue-500 px-4 pb-4 shadow-sm"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="rounded-full p-1"
        >
          <MaterialIcons name="arrow-back-ios-new" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Đổi mật khẩu</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 pt-6">
          <View className="rounded-2xl bg-white p-6 shadow-sm">
            <View className="mb-6">
              <Input
                label="Mật khẩu hiện tại"
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry
                value={oldPassword}
                onChangeText={(text) => {
                  setOldPassword(text);
                  if (errors.oldPassword) setErrors({ ...errors, oldPassword: undefined });
                }}
                error={errors.oldPassword}
              />
            </View>

            <View className="mb-6">
              <Input
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới"
                secureTextEntry
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
                }}
                error={errors.newPassword}
              />
              <Text className="mt-2 text-xs text-slate-400">
                Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
              </Text>
            </View>

            <View className="mb-2">
              <Input
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                error={errors.confirmPassword}
              />
            </View>
          </View>
        </ScrollView>

        <View 
          className="border-t border-slate-200 bg-white p-4"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TouchableOpacity
            onPress={onSubmit}
            disabled={isPending}
            activeOpacity={0.8}
            className={`items-center rounded-2xl py-4 ${isPending ? 'bg-blue-300' : 'bg-blue-500'}`}
          >
            <Text className="text-base font-bold text-white">
              {isPending ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default ChangePasswordScreen;

