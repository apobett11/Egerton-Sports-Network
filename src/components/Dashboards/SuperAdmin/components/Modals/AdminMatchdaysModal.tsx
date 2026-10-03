import React, { useEffect, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { useSeasonModeOperations } from "../../../../../President's Season Mode/hooks/useSeasonModeOperations";
import { MatchdaysView } from "../../../../../President's Season Mode/components/matchdays/MatchdaysView";
import { ErrorState, LoadingState, OperationalToast } from "../../../../../President's Season Mode/components/shared/StateDisplays";

interface AdminMatchdaysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Operations Control entry for the season matchday desk.
 * Mounts the live season data only while the popup is open.
 */
export const AdminMatchdaysModal: React.FC<AdminMatchdaysModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <AdminMatchdaysPanel onClose={onClose} />;
};

const AdminMatchdaysPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    isLoading,
    error,
    toastMessage,
    fixtures,
    referees,
    pitches,
    teams,
    capacity,
    handleExecuteChangeMatchCapacity,
    handleExecuteAddPlayday,
    handleExecuteRemovePlayday,
    handleExecuteChangePitchState,
    handleExecuteChangeTimeConfiguration,
    handleExecuteSwapReferee,
    handleExecuteShiftMatch,
    handleExecuteCancelMatch,
    handleExecuteChangeMatchResult,
    handleExecuteCancelMatchday,
    handleExecuteFlagLinesmanDefault,
    refreshData,
  } = useSeasonModeOperations();

  const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-matchdays-title"
    >
      <OperationalToast message={toastMessage} />
      <div className="w-full max-w-7xl max-h-[94vh] flex flex-col rounded-2xl border border-[#2A2A2A] bg-[#0a1520] text-white shadow-2xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-[#1a2e45] bg-[#111111] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#ff0046]/15 border border-[#ff0046]/30 text-[#ff0046] flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="admin-matchdays-title" className="text-sm font-black uppercase tracking-wider text-white">
                Matchdays
              </h2>
              <p className="text-[11px] text-gray-400 truncate">
                Full season control. Finished results can be changed only inside the matchday they were played.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] cursor-pointer"
            aria-label="Close matchdays"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <LoadingState isDark label="Loading matchdays..." />
          ) : error ? (
            <ErrorState isDark message={error} onRetry={() => refreshData()} />
          ) : (
            <MatchdaysView
              isDark
              fixtures={fixtures}
              referees={referees}
              pitches={pitches}
              teams={teams}
              selectedDateStr={selectedDateStr}
              onDateChange={setSelectedDateStr}
              onCancelMatch={handleExecuteCancelMatch}
              onChangeMatchResult={handleExecuteChangeMatchResult}
              onSwapReferee={handleExecuteSwapReferee}
              onShiftMatch={handleExecuteShiftMatch}
              onFlagLinesmanDefault={handleExecuteFlagLinesmanDefault}
              capacity={capacity}
              onChangeCapacity={handleExecuteChangeMatchCapacity}
              onAddPlayday={handleExecuteAddPlayday}
              onRemovePlayday={handleExecuteRemovePlayday}
              onCancelMatchdayNum={handleExecuteCancelMatchday}
              onChangePitchState={handleExecuteChangePitchState}
              onChangeTimeConfiguration={handleExecuteChangeTimeConfiguration}
            />
          )}
        </div>
      </div>
    </div>
  );
};
