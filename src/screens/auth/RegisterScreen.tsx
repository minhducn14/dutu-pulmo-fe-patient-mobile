import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRegister } from '@/hooks/useRegister';

const schema = z
  .object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z
      .string()
      .regex(/^0[1-9]\d{8}$/, 'Số điện thoại không hợp lệ')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .max(128, 'Mật khẩu tối đa 128 ký tự')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
      ),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    agreed: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mật khẩu xác nhận không khớp',
        path: ['confirmPassword'],
      });
    }
    if (!value.agreed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bạn phải đồng ý với điều khoản',
        path: ['agreed'],
      });
    }
  });

type FormData = z.infer<typeof schema>;

export function RegisterScreen() {
  const router = useRouter();
  const registerMutation = useRegister();
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreed: false,
    },
  });

  const onSubmit = (values: FormData) => {
    registerMutation.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      },
      {
        onSuccess: () => {
          router.push({
            pathname: '/(auth)/verify-otp',
            params: { email: values.email, mode: 'verify' },
          });
        },
      },
    );
  };

  return (
    <View 
      className="flex-1 bg-white px-6"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      <Text className="text-3xl font-bold text-slate-900">Tạo tài khoản</Text>
      <Text className="mt-2 text-slate-500">
        Bắt đầu hành trình chăm sóc sức khỏe phổi của bạn.
      </Text>

      <View className="mt-8 gap-4">
        <Controller control={control} name="fullName"
          render={({ field: { onChange, value } }) => (
            <Input label="Họ và tên" placeholder="Nhập họ tên đầy đủ"
              value={value} onChangeText={onChange} error={errors.fullName?.message} />
          )}
        />
        <Controller control={control} name="email"
          render={({ field: { onChange, value } }) => (
            <Input label="Email" placeholder="Nhập email"
              autoCapitalize="none" keyboardType="email-address"
              value={value} onChangeText={onChange} error={errors.email?.message} />
          )}
        />
        <Controller control={control} name="phone"
          render={({ field: { onChange, value } }) => (
            <Input label="Số điện thoại" placeholder="Nhập số điện thoại"
              keyboardType="phone-pad" value={value} onChangeText={onChange}
              error={errors.phone?.message} />
          )}
        />
        <Controller control={control} name="password"
          render={({ field: { onChange, value } }) => (
            <Input label="Mật khẩu" placeholder="Nhập mật khẩu" secureTextEntry
              value={value} onChangeText={onChange} error={errors.password?.message} />
          )}
        />
        <Controller control={control} name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <Input label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" secureTextEntry
              value={value} onChangeText={onChange} error={errors.confirmPassword?.message} />
          )}
        />
        <Controller control={control} name="agreed"
          render={({ field: { onChange, value } }) => (
            <Pressable className="flex-row items-center" onPress={() => onChange(!value)}>
              <View className={`mr-2 h-5 w-5 rounded border ${
                value ? 'border-[#0A7CFF] bg-[#0A7CFF]' : 'border-slate-300 bg-white'
              }`} />
              <Text className="text-slate-600">Tôi đồng ý với </Text>
              <Text className="font-semibold text-[#0A7CFF]">Điều khoản & Quy định</Text>
            </Pressable>
          )}
        />
        {errors.agreed?.message ? (
          <Text className="text-sm text-red-500">{errors.agreed.message}</Text>
        ) : null}
      </View>

      <View className="mt-6">
        <Button title="Đăng ký" loading={registerMutation.isPending}
          onPress={handleSubmit(onSubmit)} />
      </View>

      {registerMutation.error ? (
        <Text className="mt-3 text-center text-sm text-red-500">
          Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.
        </Text>
      ) : null}

      <View className="mt-6 flex-row items-center justify-center gap-1">
        <Text className="text-slate-600">Đã có tài khoản?</Text>
        <Link href="/(auth)/login" className="font-semibold text-[#0A7CFF]">Đăng nhập</Link>
      </View>
    </View>
  );
}

export default RegisterScreen;