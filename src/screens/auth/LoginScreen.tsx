import { zodResolver } from '@hookform/resolvers/zod';
import { FontAwesome } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLogin } from '@/hooks/useLogin';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type FormData = z.infer<typeof schema>;

export function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const insets = useSafeAreaInsets();

  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: FormData) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        router.replace('/(tabs)/home');
      },
    });
  };

  return (
    <View 
      className="flex-1 bg-white px-6"
      style={{ paddingTop: Math.max(insets.top, 24) }}
    >
      {/* Logo */}
      <View className="mb-6 items-center">
        <Image
          source={require('@/assets/images/logo.jpg')}
          className="h-36 w-36"
          resizeMode="cover"
        />
      </View>

      {/* Header */}
      <View className="mb-8 items-center">
        <Text className="text-3xl font-bold text-slate-900">
          Chào mừng trở lại
        </Text>
        <Text className="mt-2 text-center text-slate-500">
          Đăng nhập để tiếp tục chăm sóc sức khỏe
        </Text>
      </View>

      {/* Form Fields */}
      <View className="gap-4">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              placeholder="Nhập email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
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
      </View>

      {/* Forgot Password */}
      <Link
        href="/(auth)/forgot-password"
        className="mt-3 self-end text-sm font-medium text-slate-600"
      >
        Quên mật khẩu?
      </Link>

      {/* Login Button */}
      <View className="mt-6">
        <Button
          title="Đăng nhập"
          loading={loginMutation.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>

      {/* Error Message */}
      {loginMutation.error ? (
        <Text className="mt-3 text-center text-sm text-red-500">
          Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.
        </Text>
      ) : null}

      {/* Social Login Divider */}
      <View className="mt-8 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-slate-200" />
        <Text className="text-sm text-slate-500">Hoặc đăng nhập bằng</Text>
        <View className="h-px flex-1 bg-slate-200" />
      </View>

      {/* Social Login Buttons */}
      <View className="mt-4 flex-row gap-4">
        <TouchableOpacity
          className="flex-1 items-center justify-center rounded-xl border border-slate-200 py-3"
          onPress={() => {
            /* handle Google login */
          }}
        >
          <FontAwesome name="google" size={22} color="#EA4335" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 items-center justify-center rounded-xl border border-slate-200 py-3"
          onPress={() => {
            /* handle Facebook login */
          }}
        >
          <FontAwesome name="facebook" size={22} color="#1877F2" />
        </TouchableOpacity>
      </View>

      {/* Register Link */}
      <View className="mt-8 flex-row items-center justify-center gap-1">
        <Text className="text-slate-600">Bạn chưa có tài khoản?</Text>
        <Link href="/(auth)/register" className="font-semibold text-[#0A7CFF]">
          Đăng ký ngay
        </Link>
      </View>
    </View>
  );
}

export default LoginScreen;
