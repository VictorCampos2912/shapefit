import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

type ProgressRingProps = {
  /** Progresso de 0 a 1. Omitido = modo indeterminado (spinner de carregamento). */
  progress?: number;
  size?: number;
  strokeWidth?: number;
};

/**
 * Anel de progresso da marca ShapeFit (Direção A da identidade visual).
 * Sem `progress`: gira indefinidamente, como spinner de carregamento.
 * Com `progress` (0-1): preenche o arco proporcionalmente — ex.: séries
 * concluídas de um exercício, ou sessões finalizadas de um treino.
 */
export function ProgressRing({ progress, size = 40, strokeWidth = 5 }: ProgressRingProps) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const indeterminado = progress === undefined;

  const [rotacao] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!indeterminado) return;
    const animacao = Animated.loop(
      Animated.timing(rotacao, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animacao.start();
    return () => animacao.stop();
  }, [indeterminado, rotacao]);

  const progressoClamp = indeterminado ? 0.25 : Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - progressoClamp);

  const rotate = rotacao.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={[
        { width: size, height: size },
        indeterminado && { transform: [{ rotate }] },
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.backgroundElement}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </Animated.View>
  );
}
