import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/auth.service';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true);
      const result = await authService.forgotPassword({ email: values.email });
      setSuccessMessage(result.message || 'If the email exists, password reset instructions have been sent.');
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 px-6 pt-16">
      <Text className="text-3xl font-bold text-slate-900">Forgot password</Text>
      <Text className="mt-2 text-slate-500">Enter your registered email to receive password recovery instructions.</Text>

      <View className="mt-10 gap-4">
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
      </View>

      <View className="mt-8">
        <Button title="Send request" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
      </View>

      {successMessage ? <Text className="mt-3 text-sm text-emerald-600">{successMessage}</Text> : null}

      <Link href="/(auth)/login" className="mt-6 self-center font-semibold text-blue-600">
        Back to sign in
      </Link>
    </View>
  );
}

export default ForgotPasswordScreen;
