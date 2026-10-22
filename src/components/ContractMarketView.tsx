import React, { useState } from 'react';
import { FileText, Building2, AlertCircle, ArrowRight, CheckCircle2, Compass } from 'lucide-react';
import { GameState, PromisedRole, TransferOffer } from '../types/game';
import { playTacticalClick, playWhistle } from '../utils/audio';
import { ScoutingModal } from './ScoutingModal';

interface ContractMarketViewProps {
  state: GameState;
  onAcceptTransfer: (offer: TransferOffer) => void;
  onRequestTransferList: () => void;
  onUpdateState?: (updated: Partial<GameState>) => void;
}

export const ContractMarketView: React.FC<ContractMarketViewProps> = ({
  state,
  onAcceptTransfer,
  onRequestTransferList,
  onUpdateState,
}) => {
  const [isScoutingOpen, setIsScoutingOpen] = useState(false);
  const { player, currentClub, incomingOffers, currentWeek, trainingDoneThisWeek } = state;
  const contract = player.contract;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  const getRoleLabel = (role: PromisedRole) => {
    switch (role) {
      case 'JOGADOR_CHAVE':
        return 'JOGADOR-CHAVE (85%+ min)';
      case 'TITULAR':
        return 'TITULAR ABSOLUTO';
      case 'ROTATIVO':
        return 'TITULAR ROTATIVO';
      case 'JOVEM_DESENVOLVIMENTO':
        return 'JOVEM EM DESENVOLVIMENTO';
    }
  };

  const isTransferWindow = (currentWeek >= 1 && currentWeek <= 4) || (currentWeek >= 18 && currentWeek <= 22);

  return (
    <div className="h-full w-full p-3 sm:p-4 flex flex-col justify-between overflow-hidden select-none space-y-2.5">
      {/* Top Banner */}
      <div className="p-3.5 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-black font-mono">
            PILAR 5 · MERCADO & VÍNCULO PROFISSIONAL
          </div>
          <h1 className="text-base sm:text-lg font-black uppercase text-black leading-none mt-0.5">
            CONTRATO: {currentClub.name} (TIER {currentClub.tier})
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              playTacticalClick();
              setIsScoutingOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-black bg-[#FFCC00] hover:bg-[#ffdb33] shadow-brutal-sm text-[10px] font-mono font-black uppercase transition-all"
            title="Sondar mercado gastando treino semanal"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>SONDAGEM</span>
          </button>

          <span className={`text-[10px] font-mono font-black px-2 py-1 rounded-lg border border-black ${isTransferWindow ? 'bg-[#FFCC00]' : 'bg-stone-200'}`}>
            JANELA: {isTransferWindow ? 'ABERTA' : 'FECHADA'}
          </span>
        </div>
      </div>

      {/* Contract Terms Box (Zero Scroll) */}
      <div className="flex-1 p-3.5 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex flex-col justify-between overflow-hidden space-y-2.5">
        <div>
          <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-2">
            <span className="font-black text-xs uppercase font-mono">TERMOS CONTRATUAIS ATUAIS</span>
            <span className="font-mono text-xs font-bold text-black">{contract.yearsRemaining} ANOS RESTANTES</span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="p-2 rounded-xl border-2 border-black bg-[#FBFBFA]">
              <span className="text-[9px] font-bold text-stone-600 uppercase">SALÁRIO SEMANAL</span>
              <div className="font-black text-sm text-black mt-0.5">{formatCurrency(contract.wageWeekly)}</div>
            </div>

            <div className="p-2 rounded-xl border-2 border-black bg-[#FBFBFA]">
              <span className="text-[9px] font-bold text-stone-600 uppercase">MULTA RESCISÓRIA</span>
              <div className="font-black text-sm text-black mt-0.5">{formatCurrency(contract.releaseClause)}</div>
            </div>

            <div className="p-2 rounded-xl border-2 border-black bg-[#FBFBFA]">
              <span className="text-[9px] font-bold text-stone-600 uppercase">PAPEL PROMETIDO</span>
              <div className="font-black text-xs text-black mt-0.5">{getRoleLabel(contract.promisedRole)}</div>
            </div>

            <div className="p-2 rounded-xl border-2 border-black bg-[#FBFBFA]">
              <span className="text-[9px] font-bold text-stone-600 uppercase">BÔNUS POR GOL</span>
              <div className="font-black text-xs text-black mt-0.5">{formatCurrency(contract.goalBonus)}</div>
            </div>
          </div>
        </div>

        {/* Transfer Offers / Dissatisfaction - Inner Scrollable Container */}
        <div className="space-y-2 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between border-b border-black pb-1 shrink-0">
            <span className="text-[10px] font-black uppercase font-mono">PROPOSTAS RECEBIDAS ({incomingOffers.length})</span>
            {contract.transferRequested && (
              <span className="text-[9px] font-mono font-black text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-600">
                LISTA DE TRANSFERÊNCIAS ATIVA
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 max-h-36">
            {incomingOffers.length === 0 ? (
              <div className="p-3 rounded-xl border-2 border-black bg-stone-50 text-center text-xs font-mono text-stone-600">
                Nenhuma proposta formal no momento. Eleve seu Hype e notas para receber ofertas.
              </div>
            ) : (
              incomingOffers.map((offer) => (
                <div key={offer.id} className="p-2 rounded-xl border-2 border-black bg-[#FFCC00] flex items-center justify-between gap-2 shadow-brutal-sm">
                  <div className="font-mono leading-tight">
                    <div className="font-black text-xs uppercase text-black">{offer.club.name} (Tier {offer.club.tier})</div>
                    <div className="text-[10px] font-bold text-stone-800">
                      SALÁRIO: {formatCurrency(offer.wageWeekly)}/sem · {offer.promisedRole}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      playWhistle('short');
                      onAcceptTransfer(offer);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border-2 border-black bg-black text-[#FFCC00] font-black text-[10px] uppercase shadow-brutal-sm shrink-0 hover:bg-stone-800"
                  >
                    ASSINAR
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA Block: Request Transfer & Scouting */}
      <div className="p-3.5 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex flex-col justify-between space-y-2">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {!contract.transferRequested ? (
            <button
              onClick={() => {
                playTacticalClick();
                onRequestTransferList();
              }}
              className="w-full flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl border-[2px] border-black bg-white hover:bg-stone-50 active:translate-x-[1px] active:translate-y-[1px] shadow-brutal-sm text-black font-black text-xs uppercase tracking-wide transition-all"
            >
              <span>PEDIR LISTA DE TRANSFERÊNCIAS</span>
              <div className="w-5 h-5 rounded-md border border-black bg-black text-[#FFCC00] flex items-center justify-center">
                <ArrowRight className="w-3 h-3 stroke-[3]" />
              </div>
            </button>
          ) : (
            <div className="w-full flex-1 p-2 rounded-xl border-2 border-black bg-stone-100 text-center font-mono font-black text-xs text-black">
              ✓ TRANSFER REQUEST PROTOCOLADO
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              playTacticalClick();
              setIsScoutingOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border-[2px] border-black bg-[#FFCC00] hover:bg-[#ffdb33] active:translate-x-[1px] active:translate-y-[1px] shadow-brutal-sm text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all"
          >
            <Compass className="w-4 h-4 stroke-[2.5]" />
            <span>SONDAR MERCADO (SCOUTING)</span>
          </button>
        </div>

        {/* Hazard Stripes Footer Bar */}
        <div className="w-full h-2.5 rounded-full border border-black bg-hazard-stripes" />
      </div>

      {/* Scouting Modal */}
      <ScoutingModal
        isOpen={isScoutingOpen}
        onClose={() => setIsScoutingOpen(false)}
        state={state}
        onScoutingCompleted={(upState) => onUpdateState && onUpdateState(upState)}
        onAcceptTransfer={onAcceptTransfer}
      />
    </div>
  );
};
