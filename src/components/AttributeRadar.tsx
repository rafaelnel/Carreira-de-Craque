import React from 'react';
import { PlayerCharacter } from '../types/game';

interface AttributeRadarProps {
  player: PlayerCharacter;
  size?: number;
}

export const AttributeRadar: React.FC<AttributeRadarProps> = ({ player, size = 260 }) => {
  // 6 macro axes:
  // 1. Ritmo & Velocidade (Velocidade + Agilidade)
  // 2. Finalização (Finalização + Compostura)
  // 3. Passe & Criação (Passe Curto + Visão de Jogo)
  // 4. Drible & Técnica (Drible + Agilidade + Decisão)
  // 5. Físico (Força + Resistência + Impulsão)
  // 6. Defesa (Desarme + Marcação + Posicionamento)

  const isGK = player.position === 'GK';

  const axes = isGK
    ? [
        {
          label: 'Reflexos',
          value: player.technical.reflexos ?? 65,
        },
        {
          label: 'Elasticidade',
          value: player.technical.elasticidade ?? 65,
        },
        {
          label: 'Segurança',
          value: player.technical.segurancaMao ?? 65,
        },
        {
          label: 'Posicionamento',
          value: player.mental.posicionamento ?? 66,
        },
        {
          label: 'Jogo com Pés',
          value: player.technical.jogoComPes ?? 62,
        },
        {
          label: 'Saída do Gol',
          value: player.technical.saidaDoGol ?? 63,
        },
      ]
    : [
        {
          label: 'Velocidade',
          value: (player.physical.velocidade + player.physical.agilidade) / 2,
        },
        {
          label: 'Finalização',
          value: (player.technical.finalizacao + player.mental.compostura) / 2,
        },
        {
          label: 'Passe & Visão',
          value: (player.technical.passeCurto + player.mental.visaoDeJogo) / 2,
        },
        {
          label: 'Drible',
          value: (player.technical.drible + player.mental.decisao) / 2,
        },
        {
          label: 'Físico',
          value: (player.physical.forca + player.physical.resistencia) / 2,
        },
        {
          label: 'Defesa',
          value: (player.technical.desarme + player.technical.marcacao + player.mental.posicionamento) / 3,
        },
      ];

  const center = size / 2;
  const radius = size * 0.38;
  const numAxes = axes.length;

  // Grid levels (25, 50, 75, 100)
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (valueNormalized: number, index: number) => {
    const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2;
    const r = radius * valueNormalized;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const polygonPoints = axes
    .map((axis, i) => {
      const norm = Math.min(1, Math.max(0.1, axis.value / 100));
      const { x, y } = getCoordinates(norm, i);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background circular web */}
        {levels.map((lvl) => {
          const pts = axes
            .map((_, i) => {
              const { x, y } = getCoordinates(lvl, i);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
              strokeDasharray={lvl === 1 ? 'none' : '2,2'}
            />
          );
        })}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(1, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#334155"
              strokeWidth="1"
            />
          );
        })}

        {/* Value polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(56, 189, 248, 0.25)"
          stroke="#38bdf8"
          strokeWidth="2"
        />

        {/* Value dots */}
        {axes.map((axis, i) => {
          const norm = Math.min(1, Math.max(0.1, axis.value / 100));
          const { x, y } = getCoordinates(norm, i);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#38bdf8"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels */}
        {axes.map((axis, i) => {
          const labelDist = 1.18;
          const { x, y } = getCoordinates(labelDist, i);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-medium fill-slate-400 select-none"
            >
              {axis.label}
              <tspan className="font-mono tabular-nums font-bold fill-sky-400 ml-1">
                {' '}
                {Math.round(axis.value)}
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
};
