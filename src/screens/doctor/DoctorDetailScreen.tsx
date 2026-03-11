import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useDoctorAvailableSlots, usePublicDoctorDetail } from '@/hooks/useAppointments';

const today = new Date().toISOString().slice(0, 10);

export function DoctorDetailScreen() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const [date] = useState(today);

  const doctorQuery = usePublicDoctorDetail(doctorId);
  const slotsQuery = useDoctorAvailableSlots(doctorId, date);

  const availableSlots = useMemo(() => slotsQuery.data ?? [], [slotsQuery.data]);

  if (doctorQuery.isLoading) {
    return <Loading label="Loading doctor details..." />;
  }

  if (doctorQuery.isError || !doctorQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState title="Doctor not found" description="Please return to the doctor list." />
      </View>
    );
  }

  const doctor = doctorQuery.data;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Card>
        <View className="flex-row items-center gap-4">
          <Avatar uri={doctor.avatarUrl} size={72} />
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900">{doctor.fullName || 'Doctor'}</Text>
            <Text className="mt-1 text-sm text-blue-600">{doctor.specialty || 'Specialist'}</Text>
            <Text className="mt-1 text-xs text-slate-500">
              {doctor.yearsOfExperience ? `${doctor.yearsOfExperience} years of experience` : 'Experience is being updated'}
            </Text>
          </View>
        </View>

        <Text className="mt-4 text-sm leading-6 text-slate-700">{doctor.bio || 'Doctor profile information is being updated.'}</Text>
      </Card>

      <View className="mt-4">
        <Text className="text-base font-bold text-slate-900">Available time slots today</Text>
        {slotsQuery.isLoading ? (
          <Loading fullscreen={false} label="Loading time slots..." />
        ) : availableSlots.length === 0 ? (
          <View className="mt-3">
            <EmptyState title="No available slots" description="Please choose another doctor or try again later." />
          </View>
        ) : (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {availableSlots.slice(0, 6).map((slot) => (
              <View key={slot.id} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <Text className="text-xs font-semibold text-blue-700">
                  {slot.startTime.slice(11, 16)} - {slot.endTime.slice(11, 16)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="mt-6">
        <Button
          title="Book appointment"
          onPress={() => router.push(`/appointments/book?doctorId=${doctorId}&date=${date}`)}
        />
      </View>
    </ScrollView>
  );
}

export default DoctorDetailScreen;
