import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface StepBarProps {
  current: 1 | 2 | 3 | 4;
}

const STEPS = [
  { n: 1, label: 'Chọn lịch' },
  { n: 2, label: 'Xác nhận' },
  { n: 3, label: 'Thanh toán' },
  { n: 4, label: 'Hoàn tất' },
] as const;

export function StepBar({ current }: StepBarProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-100 bg-white px-3 py-[10px]">
      {STEPS.map((step, i) => {
        const isDone = step.n < current;
        const isActive = step.n === current;

        return (
          <View
            key={step.n}
            className="flex-1 flex-row items-center"
            style={{ justifyContent: i === 0 ? 'flex-start' : i === STEPS.length - 1 ? 'flex-end' : 'center' }}
          >

            {i > 0 && (
              <View
                className="h-[1px] flex-1"
                style={{ backgroundColor: isDone ? '#22c55e' : '#e2e8f0' }}
              />
            )}

            <View className="items-center">
              <View
                className={`h-[22px] w-[22px] items-center justify-center rounded-full ${
                  isDone
                    ? 'bg-green-500'
                    : isActive
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                }`}
              >
                {isDone ? (
                  <MaterialIcons name="check" size={12} color="white" />
                ) : (
                  <Text
                    className={`text-[10px] font-bold ${
                      isActive ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {step.n}
                  </Text>
                )}
              </View>
              <Text
                className={`mt-[3px] text-[9px] ${
                  isActive
                    ? 'font-semibold text-blue-500'
                    : isDone
                      ? 'font-normal text-green-500'
                      : 'font-normal text-gray-400'
                }`}
              >
                {step.label}
              </Text>
            </View>

            {i < STEPS.length - 1 && (
              <View
                className="h-[1px] flex-1"
                style={{ backgroundColor: step.n < current ? '#22c55e' : '#e2e8f0' }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

export default StepBar;