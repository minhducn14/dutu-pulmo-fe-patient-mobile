import { Image, View } from 'react-native';

type Props = {
  uri?: string;
  size?: number;
};

export function Avatar({ uri, size = 44 }: Props) {
  return (
    <View
      className="overflow-hidden rounded-full border border-slate-200 bg-slate-200"
      style={{
        width: size,
        height: size,
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />
      ) : (
        <View className="h-full w-full bg-slate-300" />
      )}
    </View>
  );
}

export default Avatar;