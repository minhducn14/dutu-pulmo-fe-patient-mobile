import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRegister } from '@/hooks/useRegister';

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .regex(/^0[1-9]\d{8}$/, 'Invalid phone number')
      .optional()
      .or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
    agreed: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password confirmation does not match',
        path: ['confirmPassword'],
      });
    }
    if (!value.agreed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'You must accept the terms',
        path: ['agreed'],
      });
    }
  });

type FormData = z.infer<typeof schema>;

export function RegisterScreen() {
  const router = useRouter();
  const registerMutation = useRegister();

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
          router.replace('/(auth)/login');
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-slate-50 px-6 pt-14">
      <Text className="text-3xl font-bold text-slate-900">Create account</Text>
      <Text className="mt-2 text-slate-500">Join us and start your personalized pulmonary care journey.</Text>

      <View className="mt-8 gap-4">
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Full name"
              placeholder="Enter your full name"
              value={value}
              onChangeText={onChange}
              error={errors.fullName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              placeholder="Enter your email"
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
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Phone number"
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChange}
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Confirm password"
              placeholder="Re-enter your password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="agreed"
          render={({ field: { onChange, value } }) => (
            <Pressable className="flex-row items-center" onPress={() => onChange(!value)}>
              <View className={`mr-2 h-5 w-5 rounded border ${value ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'}`} />
              <Text className="text-slate-600">I agree to the </Text>
              <Text className="font-semibold text-blue-600">Terms & Conditions</Text>
            </Pressable>
          )}
        />
        {errors.agreed?.message ? <Text className="text-sm text-red-500">{errors.agreed.message}</Text> : null}
      </View>

      <View className="mt-6">
        <Button title="Sign up" loading={registerMutation.isPending} onPress={handleSubmit(onSubmit)} />
      </View>

      {registerMutation.error ? (
        <Text className="mt-3 text-center text-sm text-red-500">Sign up failed. Please verify your information.</Text>
      ) : null}

      <View className="mt-6 flex-row items-center justify-center gap-1">
        <Text className="text-slate-600">Already have an account?</Text>
        <Link href="/(auth)/login" className="font-semibold text-blue-600">
          Sign in
        </Link>
      </View>
    </View>
  );
}

export default RegisterScreen;
