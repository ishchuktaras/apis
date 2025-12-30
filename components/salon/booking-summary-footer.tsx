import { Button } from "@/components/ui/button"
import { Check, ChevronRight } from "lucide-react"
import { Service } from "@/types/salon"

interface BookingSummaryFooterProps {
  selectedService: Service | undefined
  bookingStep: number
  onNext: () => void
  isSubmitting: boolean
  canProceed: boolean
}

export function BookingSummaryFooter({ 
  selectedService, 
  bookingStep, 
  onNext, 
  isSubmitting, 
  canProceed 
}: BookingSummaryFooterProps) {
  
  if (!selectedService || bookingStep >= 4) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50 animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="hidden sm:block">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Vaše Rezervace</p>
          <div className="flex items-center gap-3">
             <p className="font-bold text-slate-900 text-lg truncate max-w-[200px]">{selectedService.title}</p>
             <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-700 border border-slate-200">{selectedService.price} Kč</span>
          </div>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {bookingStep === 1 && (
            <Button onClick={onNext} className="w-full sm:w-auto h-12 text-base px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] rounded-xl font-bold">
              Vybrat termín <ChevronRight className="ml-2 h-5 w-5"/>
            </Button>
          )}
          {bookingStep === 2 && (
            <Button disabled={!canProceed} onClick={onNext} className="w-full sm:w-auto h-12 text-base px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 rounded-xl font-bold">
              Zadat údaje <ChevronRight className="ml-2 h-5 w-5"/>
            </Button>
          )}
          {bookingStep === 3 && (
            <Button form="booking-form" type="submit" disabled={isSubmitting || !canProceed} className="w-full sm:w-auto h-12 text-base px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 rounded-xl font-bold">
              {isSubmitting ? 'Odesílám...' : 'Dokončit rezervaci'} <Check className="ml-2 h-5 w-5"/>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}