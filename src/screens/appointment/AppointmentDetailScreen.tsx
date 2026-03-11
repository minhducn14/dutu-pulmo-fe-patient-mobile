import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import {
  useAppointmentDetail,
  useCancelAppointment,
  useDoctorAvailableSlots,
  useRescheduleAppointment,
} from '@/hooks/useAppointments';

export function AppointmentDetailScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();

  const detailQuery = useAppointmentDetail(appointmentId);
  const cancelMutation = useCancelAppointment();
  const rescheduleMutation = useRescheduleAppointment();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [rescheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedNewSlotId, setSelectedNewSlotId] = useState<string | null>(null);

  const doctorId = detailQuery.data?.doctor?.id;
  const slotsQuery = useDoctorAvailableSlots(doctorId || '', rescheduleDate);

  if (detailQuery.isLoading) {
    return <Loading label="Loading appointment detail..." />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState title="Appointment not found" description="Please try again later." />
      </View>
    );
  }

  const appointment = detailQuery.data;
  const canCancel = ['PENDING', 'CONFIRMED', 'PENDING_PAYMENT'].includes(appointment.status);
  const canReschedule = ['PENDING', 'CONFIRMED'].includes(appointment.status);

  const onConfirmCancel = () => {
    cancelMutation.mutate(
      { appointmentId, payload: { reason: reason || 'Patient requested cancellation' } },
      {
        onSuccess: () => {
          setCancelModalOpen(false);
          router.replace('/(tabs)/appointments');
        },
      },
    );
  };

  const onReschedule = () => {
    if (!selectedNewSlotId) return;

    rescheduleMutation.mutate(
      { appointmentId, payload: { newTimeSlotId: selectedNewSlotId } },
      {
        onSuccess: () => {
          void detailQuery.refetch();
        },
      },
    );
  };

  return (
    <>
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-2xl font-bold text-slate-900">Appointment detail</Text>

        <Card className="mt-4">
          <Text className="text-sm text-slate-500">Appointment number</Text>
          <Text className="text-base font-bold text-slate-900">{appointment.appointmentNumber}</Text>

          <Text className="mt-3 text-sm text-slate-500">Doctor</Text>
          <Text className="text-base font-semibold text-slate-900">{appointment.doctor.fullName || 'Doctor'}</Text>

          <Text className="mt-3 text-sm text-slate-500">Scheduled at</Text>
          <Text className="text-base font-semibold text-slate-900">
            {new Date(appointment.scheduledAt).toLocaleString()}
          </Text>

          <Text className="mt-3 text-sm text-slate-500">Status</Text>
          <Text className="text-base font-semibold text-blue-600">{appointment.status}</Text>
        </Card>

        {canReschedule ? (
          <Card className="mt-4">
            <Text className="text-base font-bold text-slate-900">Reschedule</Text>
            <Text className="mt-1 text-xs text-slate-500">Available slots on {rescheduleDate}</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {(slotsQuery.data ?? []).slice(0, 8).map((slot) => {
                const selected = selectedNewSlotId === slot.id;
                return (
                  <Button
                    key={slot.id}
                    title={`${slot.startTime.slice(11, 16)} - ${slot.endTime.slice(11, 16)}`}
                    variant={selected ? 'primary' : 'secondary'}
                    onPress={() => setSelectedNewSlotId(slot.id)}
                  />
                );
              })}
            </View>
            <View className="mt-3">
              <Button title="Confirm reschedule" loading={rescheduleMutation.isPending} onPress={onReschedule} />
            </View>
          </Card>
        ) : null}

        {canCancel ? (
          <View className="mt-4">
            <Button title="Cancel appointment" variant="secondary" onPress={() => setCancelModalOpen(true)} />
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={cancelModalOpen} onRequestClose={() => setCancelModalOpen(false)}>
        <Card className="w-full">
          <Text className="text-lg font-bold text-slate-900">Cancel this appointment?</Text>
          <Text className="mt-1 text-sm text-slate-500">Please provide a cancellation reason.</Text>

          <View className="mt-3">
            <Input value={reason} onChangeText={setReason} placeholder="Cancellation reason" />
          </View>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Button title="Close" variant="secondary" onPress={() => setCancelModalOpen(false)} />
            </View>
            <View className="flex-1">
              <Button title="Confirm cancel" loading={cancelMutation.isPending} onPress={onConfirmCancel} />
            </View>
          </View>
        </Card>
      </Modal>
    </>
  );
}

export default AppointmentDetailScreen;