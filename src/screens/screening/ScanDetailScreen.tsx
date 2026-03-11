import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { screeningService } from '@/services/screening.service';

export function ScanDetailScreen() {
  const { screeningId } = useLocalSearchParams<{ screeningId: string }>();

  const detailQuery = useQuery({
    queryKey: ['screenings', 'detail', screeningId],
    queryFn: () => screeningService.getScreeningById(screeningId),
    enabled: Boolean(screeningId),
  });

  if (detailQuery.isLoading) return <Loading label="Loading analysis details..." />;

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState title="Unable to load data" description="The analysis session does not exist or you do not have access." />
      </View>
    );
  }

  const screening = detailQuery.data;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-slate-900">Analysis details</Text>

      <Card className="mt-4">
        <Text className="text-sm text-slate-500">Screening code</Text>
        <Text className="text-base font-bold text-slate-900">{screening.screeningNumber}</Text>

        <Text className="mt-3 text-sm text-slate-500">Status</Text>
        <Text className="text-base font-semibold text-blue-600">{screening.status}</Text>

        <Text className="mt-3 text-sm text-slate-500">Screening type</Text>
        <Text className="text-base font-semibold text-slate-900">{screening.screeningType}</Text>
      </Card>

      <Card className="mt-4">
        <Text className="text-base font-bold text-slate-900">AI results</Text>
        {screening.aiAnalyses?.length ? (
          <View className="mt-3 gap-2">
            {screening.aiAnalyses.map((analysis) => (
              <View key={analysis.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Text className="text-sm font-semibold text-slate-900">{analysis.diagnosisStatus}</Text>
                <Text className="mt-1 text-xs text-slate-500">Findings: {analysis.totalFindings}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="mt-2 text-sm text-slate-500">No AI results yet.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

export default ScanDetailScreen;