import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';

// --- DEFINICE TYPŮ ---

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface Appointment {
  id: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  hasArrived: boolean; // Pole pro fyzickou přítomnost
}

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSave: (updatedAppointment: Appointment) => void;
}

// --- HLAVNÍ KOMPONENTA MODÁLNÍHO OKNA ---

export function AppointmentDetailModal({ isOpen, onClose, appointment, onSave }: AppointmentDetailModalProps) {
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [hasArrived, setHasArrived] = useState<boolean>(appointment.hasArrived);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens with new appointment
  useEffect(() => {
    setStatus(appointment.status);
    setHasArrived(appointment.hasArrived);
    setError(null);
  }, [appointment, isOpen]);

  if (!isOpen) return null;

  const handleCheckInToggle = () => {
    const newValue = !hasArrived;
    setHasArrived(newValue);
    
    // Pokud odškrtneme, že dorazil, a status byl "Proběhlo", vrátíme ho na "Potvrzeno"
    // aby nedocházelo k nekonzistenci dat.
    if (!newValue && status === 'COMPLETED') {
      setStatus('CONFIRMED');
    }
    setError(null);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as AppointmentStatus;

    // VALIDACE: (Pojistka, i když je option skrytý)
    if (newStatus === 'COMPLETED' && !hasArrived) {
      setError('Nelze označit jako "Proběhlo", dokud není potvrzena fyzická návštěva (Check-in).');
      return;
    }

    setStatus(newStatus);
    setError(null);
  };

  const handleSave = () => {
    onSave({
      ...appointment,
      status,
      hasArrived
    });
    // onClose(); // Necháme rodiče zavřít okno až po úspěšném uložení (async)
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 font-sans">
        
        {/* Hlavička */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Detail rezervace</h2>
            <p className="text-sm text-slate-500">ID: {appointment.id.split('-')[0]}...</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Obsah */}
        <div className="p-6 space-y-6">
          
          {/* Informace o klientovi a službě */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Klient</p>
                <p className="font-semibold text-slate-900">{appointment.clientName}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Termín</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{appointment.date}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-slate-900">{appointment.time} ({appointment.duration} min)</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{appointment.serviceName}</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* CHECK-IN SEKCE - Klíčová logika */}
          {/* Zde je to místo, kde administrátor/zaměstnanec klikne, když klient vejde do dveří */}
          <div className={`p-4 rounded-lg border transition-colors ${hasArrived ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${hasArrived ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                   <MapPin size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Dorazil zákazník?</p>
                  <p className="text-xs text-slate-500">
                    {hasArrived ? 'Ano, zákazník je přítomen.' : 'Čekáme na příchod zákazníka.'}
                  </p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button 
                onClick={handleCheckInToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 ${
                  hasArrived ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <span className="sr-only">Potvrdit příchod</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    hasArrived ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Výběr statusu */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">
              Stav objednávky
            </label>
            <select
              value={status}
              onChange={handleStatusChange}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all shadow-sm"
            >
              <option value="PENDING">⏳ Čeká na potvrzení</option>
              <option value="CONFIRMED">✅ Potvrzeno (Zarezervováno)</option>
              
              {/* ZMĚNA: Option "Proběhlo" se zobrazí pouze pokud je potvrzen příchod */}
              {(hasArrived || status === 'COMPLETED') && (
                <option value="COMPLETED">
                  🏁 Proběhlo (Zaplaceno a hotovo)
                </option>
              )}
              
              <option value="NO_SHOW">🚫 Nedostavil se (No-show)</option>
              <option value="CANCELLED">❌ Zrušeno</option>
            </select>
            
            {/* Chybová hláška */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded animate-in slide-in-from-top-1">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            {!hasArrived && status !== 'COMPLETED' && (
               <p className="text-xs text-slate-500 mt-1 ml-1 flex items-center gap-1">
                 <AlertCircle size={12} />
                 Možnost "Proběhlo" se odemkne až po potvrzení příchodu výše.
               </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Zrušit
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-slate-900 bg-[#F4C430] rounded-lg hover:bg-[#E0B120] transition-colors shadow-sm"
          >
            Uložit změny
          </button>
        </div>
      </div>
    </div>
  );
}