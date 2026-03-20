import React, { useState, useEffect } from 'react';
import { Text, TextProps } from 'react-native';

interface TypingEffectProps extends TextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  speed = 30,
  onComplete,
  style,
  ...props
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');

    const chars = [...text];
    let index = 0;

    const timer = setInterval(() => {
      if (index < chars.length) {
        setDisplayedText((prev) => prev + chars[index]);
        index++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <Text style={style} {...props}>
      {displayedText}
    </Text>
  );
};