import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { useCreateAppointment, useDoctorAvailableSlots } from '@/hooks/useAppointments';

const schema = z.object({
  chiefComplaint: z.string().optional(),
  symptoms: z.string().optional(),
  patientNotes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const today = new Date().toISOString().slice(0, 10);

export function BookAppointmentScreen() {
  const router = useRouter();
  const { doctorId, date = today } = useLocalSearchParams<{ doctorId: string; date: string }>();
  const slotsQuery = useDoctorAvailableSlots(doctorId, date);
  const createMutation = useCreateAppointment();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      chiefComplaint: '',
      symptoms: '',
      patientNotes: '',
    },
  });

  const onSubmit = (values: FormData) => {
    if (!selectedSlotId) {
      return;
    }

    createMutation.mutate(
      {
        timeSlotId: selectedSlotId,
        chiefComplaint: values.chiefComplaint,
        symptoms: values.symptoms ? values.symptoms.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
        patientNotes: values.patientNotes,
      },
      {
        onSuccess: (appointment) => {
          router.replace(`/appointments/${appointment.id}`);
        },
      },
    );
  };

  if (slotsQuery.isLoading) {
    return <Loading label="Loading time slots..." />;
  }

  const slots = slotsQuery.data ?? [];

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-slate-900">Đặt lịch khám</Text>
      <Text className="mt-1 text-slate-500">Ngày khám: {date}</Text>

      <Card className="mt-4">
        <View className="flex-row items-center justify-between">
          <View className="items-center">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-[#0A7CFF]">
              <Text className="text-xs font-bold text-white">1</Text>
            </View>
            <Text className="mt-1 text-xs text-[#0A7CFF]">Chọn lịch</Text>
          </View>
          <View className="h-px flex-1 bg-slate-200" />
          <View className="items-center">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-slate-200">
              <Text className="text-xs font-bold text-slate-500">2</Text>
            </View>
            <Text className="mt-1 text-xs text-slate-400">Xác nhận</Text>
          </View>
          <View className="h-px flex-1 bg-slate-200" />
          <View className="items-center">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-slate-200">
              <Text className="text-xs font-bold text-slate-500">3</Text>
            </View>
            <Text className="mt-1 text-xs text-slate-400">Thanh toán</Text>
          </View>
        </View>
      </Card>

      <Card className="mt-4">
        <Text className="text-base font-bold text-slate-900">Chọn giờ khám</Text>

        {slots.length === 0 ? (
          <View className="mt-3">
            <EmptyState title="Không có khung giờ trống" description="Vui lòng chọn ngày khác." />
          </View>
        ) : (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {slots.map((slot) => {
              const selected = selectedSlotId === slot.id;
              return (
                <Button
                  key={slot.id}
                   title={`${slot.startTime.slice(11, 16)} - ${slot.endTime.slice(11, 16)}`}
                   variant={selected ? 'primary' : 'secondary'}
                   fullWidth={false}
                   onPress={() => setSelectedSlotId(slot.id)}
                 />
              );
            })}
          </View>
        )}
      </Card>

      <Card className="mt-4">
        <Text className="text-base font-bold text-slate-900">Thông tin bổ sung</Text>
        <View className="mt-3 gap-3">
          <Controller
            control={control}
            name="chiefComplaint"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Lý do khám"
                placeholder="Ví dụ: Ho kéo dài"
                value={value}
                onChangeText={onChange}
                error={errors.chiefComplaint?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="symptoms"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Triệu chứng"
                placeholder="Ngăn cách bằng dấu phẩy"
                value={value}
                onChangeText={onChange}
                error={errors.symptoms?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="patientNotes"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Ghi chú"
                placeholder="Thông tin thêm cho bác sĩ"
                value={value}
                onChangeText={onChange}
                error={errors.patientNotes?.message}
              />
            )}
          />
        </View>
      </Card>

      {!selectedSlotId ? <Text className="mt-3 text-sm text-amber-600">Vui lòng chọn khung giờ trước khi tiếp tục.</Text> : null}

      <View className="mt-6">
        <Button title="Tiếp tục" loading={createMutation.isPending} onPress={handleSubmit(onSubmit)} />
      </View>

      {createMutation.isError ? (
        <Text className="mt-3 text-sm text-red-500">Không thể tạo lịch khám. Vui lòng thử lại.</Text>
      ) : null}
    </ScrollView>
  );
}

export default BookAppointmentScreen;
