import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, Clock, Info } from "lucide-react"

interface TimeSelectionProps {
  selectedDate: string
  onDateChange: (date: string) => void
  availableSlots: string[]
  selectedTime: string | null
  onTimeSelect: (time: string) => void
  loadingSlots: boolean
  onBack: () => void
}

export function TimeSelection({ 
  selectedDate, 
  onDateChange, 
  availableSlots, 
  selectedTime, 
  onTimeSelect, 
  loadingSlots,
  onBack 
}: TimeSelectionProps) {
  return (
    <section className="space-y-6 animate-in slide-in-from-right-8 duration-300 fade-in">
      <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="pl-0 text-slate-500 hover:text-slate-900 mb-2 group h-auto py-0 hover:bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"/> Zpět na služby
          </Button>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Krok 2/3</span>
      </div>

      <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800">
        <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">2</span> Vyberte termín
      </h2>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
        <div>
          <Label className="text-slate-700 font-medium mb-2 block flex items-center gap-2"><Calendar className="h-4 w-4"/> Datum návštěvy</Label>
          <Input 
            type="date" 
            className="mt-2 h-12 text-lg bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary cursor-pointer w-full" 
            min={new Date().toISOString().split('T')[0]} 
            value={selectedDate} 
            onChange={e => onDateChange(e.target.value)} 
          />
        </div>

        <div>
          <Label className="text-slate-700 font-medium mb-2 block flex items-center gap-2"><Clock className="h-4 w-4"/> Dostupné časy</Label>
          <div className="min-h-[100px]">
              {!selectedDate ? 
                  <div className="text-sm text-slate-500 italic p-6 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
                      Nejdříve vyberte datum v kalendáři výše.
                  </div> :
              loadingSlots ? 
                  <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto opacity-50"></div><p className="text-xs text-slate-400 mt-2">Ověřuji dostupnost...</p></div> :
              availableSlots.length === 0 ? 
                  <div className="text-sm text-red-600 font-medium p-6 bg-red-50 rounded-lg text-center border border-red-100 flex flex-col items-center gap-2">
                      <Info className="h-5 w-5"/>
                      Pro tento den je bohužel plno nebo zavřeno.
                  </div> :
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {availableSlots.map(time => (
                  <button 
                  key={time} 
                  onClick={() => onTimeSelect(time)}
                  className={`py-3 px-2 text-sm rounded-lg border transition-all duration-200 font-medium ${
                      selectedTime === time 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105 transform' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary hover:bg-primary/5'
                  }`}
                  >
                  {time}
                  </button>
              ))}
              </div>
              }
          </div>
        </div>
      </div>
    </section>
  )
}