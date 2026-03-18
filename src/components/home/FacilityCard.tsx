import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

export interface Facility {
  id: string;
  name: string;
  address: string;
  type: string;
  distance: string;
  logo: string;
  typeColor: string;
  typeBg: string;
}

interface FacilityCardProps {
  item: Facility;
}

export function FacilityCard({ item }: FacilityCardProps) {
  return (
    <Pressable
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      className="elevation-1 w-[152px] rounded-[18px] border border-slate-100 bg-white p-3 shadow-sm"
      onPress={() => router.push(`/hospitals/${item.id}`)}
    >
      <View className="mb-2.5 h-24 w-24 self-center overflow-hidden rounded-xl bg-slate-50">
        <Image
          source={{ uri: item.logo }}
          className="h-full w-full"
          resizeMode="cover"
        />
      </View>
      <Text
        className="text-sm font-bold leading-[18px] text-gray-800"
        numberOfLines={2}
      >
        {item.name}
      </Text>
      <Text className="mb-1.5 mt-1 text-[11px] text-gray-500" numberOfLines={1}>
        {item.address}
      </Text>

      <View className="mt-auto flex-row items-center justify-between">
        <View
          style={{ backgroundColor: item.typeBg }}
          className="rounded-md px-1.5 py-0.5"
        >
          <Text
            style={{ color: item.typeColor }}
            className="text-[9px] font-semibold"
          >
            {item.type}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
