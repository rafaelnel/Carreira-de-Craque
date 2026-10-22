# Sistema de Aposentadoria (35–40 Anos), Evolução Orgânica & Regressão de Atributos

Plano técnico e de design para introduzir o ciclo completo de vida profissional do atleta: evolução orgânica orientada pelo rendimento em campo (somada ao treino), regressão física natural a partir dos 31 anos, janela de decisão de aposentadoria entre 35 e 39 anos e encerramento compulsório aos 40 anos com memorial de carreira.

---

## Decisões Confirmadas do Usuário

> [!IMPORTANT]
> Decisões alinhadas na etapa de clarificação:
> 1. **Janela de Aposentadoria (35 aos 39 anos)**: Ao término de cada temporada a partir dos 35 anos, o jogador tem a opção voluntária de anunciar sua aposentadoria ou renovar/seguir por mais um ano.
> 2. **Aposentadoria Compulsória aos 40 anos**: Ao completar 40 anos, a carreira como atleta é compulsoriamente encerrada, abrindo a tela solene de legado histórico e memorial.
> 3. **Curva de Regressão por Idade**: Atributos físicos (Velocidade, Agilidade, Resistência, Impulsão) iniciam declínio gradual após os 31 anos. Atributos técnicos e mentais (Visão de Jogo, Passe, Compostura, Posicionamento) resistem por mais tempo, refletindo a maturidade tática de veteranos.
> 4. **Evolução Orgânica Balanceada**: Minutos em campo, notas nas partidas, gols, assistências e desarmes geram ganho orgânico de XP em jogo a jogo, potencializado pelas 2 áreas de treino ativas escolhidas pelo jogador.
> 5. **Limites e Layout**: Mantém rigorosamente a escala de 60 a 99 de OVR e a arquitetura sem scroll de página inteira (single viewport).

---

## 1. Visão Geral & Conceito Central

- **O que faz**: Transforma a carreira em uma jornada biológica autêntica. O atleta jovem ganha atributos rapidamente através de tempo de jogo e treinos; alcança o auge profissional (26–30 anos); passa a compensar a perda gradual de velocidade e resistência com visão tática refinada (31–34 anos); e navega os anos finais de carreira (35–40 anos) decidindo o momento certo de pendurar as chuteiras.
- **Público-alvo**: Jogadores de simulação profunda (estilo Football Manager / New Star Soccer) que valorizam planejamento a longo prazo e gestão de declínio físico.

---

## 2. Experiência do Usuário & Design Visual

### 2.1 Fluxo de Aposentadoria (35 aos 40 anos)
```
      [Fim da Temporada]
              │
      Idade < 35 anos ──────────► Avança para Temporada Seguinte
              │
    35 <= Idade <= 39 anos ─────► Modal de Transição: "Decisão de Carreira"
              │                   ├─ [Continuar por mais 1 temporada]
              │                   └─ [Anunciar Aposentadoria Imediata]
              │
       Idade == 40 anos ────────► Aposentadoria Compulsória Automática
                                  └─ Tela de Consagração & Memorial de Carreira
```

1. **Card de Veterano (35–39 anos)**:
   - Na tela de Perfil e Contrato, aparece o selo de veterano com o status de aposentadoria planejado.
   - Ao fim da temporada, surge o modal: *"Você tem X anos. Deseja pendurar as chuteiras agora ou disputar mais um ano profissional?"*
2. **Tela de Consagração Final (Hall da Fama / Memorial aos 40 anos)**:
   - Apresenta resumo completo da carreira: total de jogos oficiais, gols, assistências, nota média vitalícia, clubes defendidos, títulos conquistados e evolução histórica do OVR (gráfico ou ledger).
   - Botão para reiniciar uma nova carreira como jovem promessa de 18 anos.

### 2.2 Indicadores de Evolução Orgânica & Regressão
- No **Perfil** e nos **Relatórios de Simulação**, atributos ganham micro-indicadores táteis:
  - `▲` (Verde neon): Atributo em alta orgânica (impulsionado por atuações em campo + treino).
  - `▼` (Vermelho/Laranja): Atributo em declínio de veterano (queda física suave a cada ciclo).
  - Escala sempre protegida: nenhum atributo cai abaixo de 60 e nenhum sobe acima de 99.

---

## 3. Arquitetura Técnica & Modelo Matemático

```
┌────────────────────────────────────────────────────────────────────────┐
│                       MOTOR DE PROGRESSÃO ORGÂNICA                     │
│                                                                        │
│   Partida Simulada (Minutos, Gols, Assist, Desarmes, Nota)             │
│                         │                                              │
│                         ▼                                              │
│            XP Orgânico Gerado por Ações em Campo                       │
│                         +                                              │
│            Bônus das 2 Áreas de Treino Selecionadas                    │
│                         │                                              │
│                         ▼                                              │
│              Cálculo de Idade & Fator Biológico                        │
│        • < 23 anos: Multiplicador de Crescimento (+30%)                │
│        • 23 a 30 anos: Estabilidade & Auge Profissional                │
│        • > 31 anos: Declínio Físico (-0.5 a -1.5 pts/ano)              │
│        • > 34 anos: Declínio Físico Acelerado, Mentais Estáveis        │
│                         │                                              │
│                         ▼                                              │
│           Atualização de Atributos & CA (Clamp 60 a 99)                │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Regras Matemáticas de Idade
- **Evolução em Campo (Orgânica)**:
  - Atacantes ganham XP orgânico em `finalizacao` e `compostura` a cada gol e arremate no alvo.
  - Meias ganham XP em `passeCurto`, `passeLongo` e `visaoDeJogo` por assistências e passes chave.
  - Defensores/Volantes ganham XP em `desarme`, `marcacao` e `posicionamento` por desarmes e clean sheets.
  - A nota média da partida multiplica todo o ganho orgânico da rodada.
- **Regressão Fisiológica (Pós-31 anos)**:
  - Físicos afetados: `velocidade`, `agilidade`, `resistencia`, `impulsao`.
  - Queda anual média: 1 a 2 pontos por temporada pós-31 anos, intensificando aos 36+ anos.
  - Atributos mentais (`decisao`, `posicionamento`, `compostura`, `visaoDeJogo`) ganham bônus de experiência e mantêm-se altos para compensar o desgaste físico, replicando ícones reais do futebol veterano.

---

## 4. Plano de Implementação em Arquivos

1. **`src/types/game.ts`**:
   - Adicionar campos `isRetired?: boolean`, `retirementAnnounced?: boolean`, `peakAbility?: number` no `PlayerCharacter`.
2. **`src/utils/simulation.ts`**:
   - Implementar cálculo de XP orgânico pós-jogo baseado em ações individuais.
   - Implementar função de envelhecimento e declínio físico sazonal (`applyAgeDegradation`).
   - Implementar gatilho de aposentadoria ao término de temporada aos 35–39 (opcional) e 40 (compulsório).
3. **`src/components/RetirementModal.tsx`**:
   - Modal temático para decisão de aposentadoria (35–39 anos) ou celebração de despedida aos 40 anos com placa de consagração e números históricos.
4. **`src/components/DashboardView.tsx` & `src/components/CareerHistoryView.tsx`**:
   - Exibir selo de veterano, status de aposentadoria e destaques de carreira no memorial.
5. **`src/App.tsx`**:
   - Integrar controle de aposentadoria ao loop de fim de temporada da simulação em lote.
