import { Stack, useRouter } from 'expo-router';
import { View, Text, FlatList, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSpecialties } from '@/hooks/useAppointments';

const getSpecialtyConfig = (specialty: string) => {
  switch (specialty) {
    case 'Pulmonology':
      return { label: 'Hô hấp', icon: 'lungs', color: '#0A7CFF', bg: '#EFF6FF' };
    case 'Thoracic Surgery':
      return { label: 'Phẫu thuật lồng ngực', icon: 'heart-pulse', color: '#22C55E', bg: '#F0FDF4' };
    case 'Respiratory Medicine':
      return { label: 'Nội khoa hô hấp', icon: 'stethoscope', color: '#4F46E5', bg: '#EEF2FF' };
    case 'Tuberculosis':
      return { label: 'Lao phổi', icon: 'virus', color: '#EF4444', bg: '#FEF2F2' };
    default:
      return { label: specialty, icon: 'medical-bag', color: '#6B7280', bg: '#F3F4F6' };
  }
};

export default function SpecialtiesScreen() {
  const router = useRouter();
  const { data, isLoading } = useSpecialties();

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Stack.Screen
        options={{
          title: 'Khám chuyên khoa',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'white' },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
              <MaterialIcons name="arrow-back-ios" size={20} color="#1F2937" />
            </Pressable>
          ),
        }}
      />
      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8' }}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <FlatList
            data={data || []}
            keyExtractor={(item) => item}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => {
              const { label, icon, color, bg } = getSpecialtyConfig(item);
              return (
                <Pressable
                  onPress={() => router.push(`/doctors?specialty=${item}`)}
                  style={({ pressed }) => ({
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 1,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons name={icon as any} size={28} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
                      {label}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}
