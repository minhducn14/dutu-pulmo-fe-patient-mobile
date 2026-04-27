import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useResetPassword } from '@/hooks/useResetPassword';
import { Ionicons } from '@expo/vector-icons';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .max(128, 'Mật khẩu tối đa 128 ký tự')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
      ),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordScreen() {
  const router = useRouter();
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const resetPasswordMutation = useResetPassword();
  const insets = useSafeAreaInsets();
  const [serverError, setServerError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = (values: FormData) => {
    if (!email || !otp) {
      setServerError('Thông tin không hợp lệ. Vui lòng thử lại từ đầu.');
      return;
    }
    setServerError(null);
    resetPasswordMutation.mutate(
      { email, otp, newPassword: values.newPassword },
      {
        onSuccess: () => router.replace('/(auth)/login'),
        onError: () =>
          setServerError('Đặt lại mật khẩu thất bại. OTP có thể đã hết hạn.'),
      },
    );
  };

  return (
    <View 
      className="flex-1 bg-white px-6"
      style={{ paddingTop: Math.max(insets.top, 24) }}
    >
      <Text className="text-3xl font-bold text-slate-900">Mật khẩu mới</Text>
      <Text className="mt-2 text-slate-500">
        Đặt mật khẩu mới cho tài khoản của bạn.
      </Text>

      <View className="mt-10 gap-4">
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới"
              secureTextEntry={!showPassword}
              value={value}
              onChangeText={onChange}
              error={errors.newPassword?.message}
              right={
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              }
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              secureTextEntry={!showConfirmPassword}
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
              right={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              }
            />
          )}
        />
      </View>

      {serverError ? (
        <Text className="mt-3 text-sm text-red-500 text-center">{serverError}</Text>
      ) : null}

      <View className="mt-8">
        <Button
          title="Lưu mật khẩu"
          loading={resetPasswordMutation.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </View>
  );
}

export default ResetPasswordScreen;