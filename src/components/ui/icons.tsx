import Svg, { Circle, Path } from 'react-native-svg';

/**
 * Conjunto de ícones de interface da identidade ShapeFit — traço 2px,
 * cantos arredondados, sem preenchimento (mesmo padrão visual do
 * artifact de revisão da marca). Cor e tamanho controlados por quem usa
 * o ícone (props `color`/`size`), não fixos aqui.
 */

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const defaults = { size: 24, color: '#000000', strokeWidth: 2 };

export function ConcluirIcon({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EditarIcon({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20h9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FinalizarIcon({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 22V4a1 1 0 0 1 1-1h11l4 4v15"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 15h15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DescansoIcon({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 7v5l3.5 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HistoricoIcon({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3v18h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 15l4-5 3 3 5-7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PerfilIcon({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ImportarIcon({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 21h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VoltarIcon({ size = defaults.size, color = defaults.color, strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AcoesIcon({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5} cy={12} r={1.5} fill={color} />
      <Circle cx={12} cy={12} r={1.5} fill={color} />
      <Circle cx={19} cy={12} r={1.5} fill={color} />
    </Svg>
  );
}

export function NotificacaoIcon({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.63 13a17 17 0 0 0 .37-2 19 19 0 0 0-.63-5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.26 6.26A20 20 0 0 0 5 13a20 20 0 0 0 1.26 6.74"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 3a9 9 0 0 0-9 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12a9 9 0 0 0-4.24-7.65" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={12} r={1} fill={color} />
    </Svg>
  );
}
