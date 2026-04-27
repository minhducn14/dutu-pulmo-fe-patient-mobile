import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForgotPassword } from '@/hooks/useForgotPassword';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordScreen() {
  const router = useRouter();
  const forgotPasswordMutation = useForgotPassword();
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: FormData) => {
    // Server luôn trả 200 dù email tồn tại hay không (bảo mật).
    // Luôn điều hướng sang OTP sau khi gọi API để không lộ thông tin.
    forgotPasswordMutation.mutate(
      { email: values.email },
      {
        onSettled: () => {
          router.push({
            pathname: '/(auth)/verify-otp',
            params: { email: values.email, mode: 'reset' },
          });
        },
      },
    );
  };

  return (
    <View 
      className="flex-1 bg-white px-6"
      style={{ paddingTop: Math.max(insets.top, 24) }}
    >
      <Text className="text-3xl font-bold text-slate-900">Quên mật khẩu</Text>
      <Text className="mt-2 text-slate-500">
        Nhập email liên kết với tài khoản để nhận mã xác thực khôi phục mật khẩu.
      </Text>

      <View className="mt-10 gap-4">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              placeholder="Nhập email của bạn"
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />
      </View>

      <View className="mt-8">
        <Button
          title="Tiếp tục"
          loading={forgotPasswordMutation.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>

      <Link href="/(auth)/login" className="mt-6 self-center font-semibold text-[#0A7CFF]">
        Quay lại đăng nhập
      </Link>
    </View>
  );
}

export default ForgotPasswordScreen;