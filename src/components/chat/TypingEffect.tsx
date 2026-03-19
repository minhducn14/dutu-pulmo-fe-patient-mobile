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
    let index = 0;
    setDisplayedText('');
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <Text style={style} {...props}>
      {displayedText}
    </Text>
  );
};
