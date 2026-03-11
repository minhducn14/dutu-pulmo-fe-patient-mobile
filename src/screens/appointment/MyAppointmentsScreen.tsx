import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useAppointments } from '@/hooks/useAppointments';

const statusToVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  CONFIRMED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'error',
  PENDING: 'warning',
  CHECKED_IN: 'info',
  IN_PROGRESS: 'info',
  RESCHEDULED: 'warning',
  PENDING_PAYMENT: 'warning',
};

export function MyAppointmentsScreen() {
  const router = useRouter();
  const appointmentsQuery = useAppointments();

  if (appointmentsQuery.isLoading) {
    return <Loading label="Loading appointments..." />;
  }

  if (appointmentsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState title="Unable to load appointments" description="Please try again later." />
      </View>
    );
  }

  const appointments = appointmentsQuery.data?.items ?? [];

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-slate-900">Appointments</Text>

      <View className="mt-4 gap-3">
        {appointments.length === 0 ? (
          <EmptyState title="No appointments yet" description="Book a doctor to get started." />
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <View className="flex-row items-center justify-between">
                <Badge
                  label={appointment.status}
                  variant={statusToVariant[appointment.status] || 'neutral'}
                />
                <Avatar uri={appointment.doctor.avatarUrl} size={42} />
              </View>

              <Text className="mt-3 text-base font-bold text-slate-900">
                {appointment.doctor.fullName || 'Doctor'}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">{appointment.doctor.specialty || 'Specialist'}</Text>
              <Text className="mt-1 text-xs text-slate-500">
                {new Date(appointment.scheduledAt).toLocaleString()}
              </Text>

              <View className="mt-3">
                <Button title="View details" onPress={() => router.push(`/appointments/${appointment.id}`)} />
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

export default MyAppointmentsScreen;
