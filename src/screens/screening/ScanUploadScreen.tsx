import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { permissions } from '@/constants/permissions';

export function ScanUploadScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-slate-900">Image analysis</Text>
      <Text className="mt-1 text-slate-500">Upload X-ray images to run AI screening</Text>

      <Card className="mt-4">
        <EmptyState
          title="Upload feature unavailable"
          description="Backend currently restricts screening creation/image upload to DOCTOR and ADMIN roles."
        />
      </Card>

      <View className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Text className="text-sm text-blue-700">
          Permission summary for current role PATIENT:
          {'\n'}- canCreateRequest: {String(permissions.screening.canCreateRequest)}
          {'\n'}- canUploadImage: {String(permissions.screening.canUploadImage)}
          {'\n'}- canReadOwnDetail: {String(permissions.screening.canReadOwnDetail)}
          {'\n'}
          {'\n'}When backend enables patient permissions, this screen will directly use:
          {'\n'}- POST /screenings
          {'\n'}- POST /screenings/:screeningId/images/upload
        </Text>
      </View>
    </ScrollView>
  );
}

export default ScanUploadScreen;
