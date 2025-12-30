import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"
import { ClientInfo } from "@/types/salon"

interface BookingConfirmationProps {
  clientInfo: ClientInfo
  selectedDate: string
  selectedTime: string | null
  serviceTitle: string | undefined
  salonName: string
  onReset: () => void
}

export function BookingConfirmation({ 
  clientInfo, 
  selectedDate, 
  selectedTime, 
  serviceTitle, 
  salonName,
  onReset 
}: BookingConfirmationProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8 border-none shadow-xl animate-in zoom-in-95 duration-300 bg-white">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 shadow-sm">
          <Check className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Rezervace odeslána!</h2>
        <p className="text-muted-foreground mb-8">
          Děkujeme, <strong>{clientInfo.name}</strong>. Potvrzení vám dorazí na e-mail.
        </p>
        <div className="bg-slate-50 p-6 rounded-lg text-left mb-8 text-sm text-foreground space-y-3 border border-slate-100">
          <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-muted-foreground">Datum</span>
              <span className="font-medium">{selectedDate}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-muted-foreground">Čas</span>
              <span className="font-medium">{selectedTime}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-muted-foreground">Služba</span>
              <span className="font-medium">{serviceTitle}</span>
          </div>
          <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">Salon</span>
              <span className="font-medium">{salonName}</span>
          </div>
        </div>
        <Button onClick={onReset} variant="outline" className="w-full h-12 border-slate-300 hover:bg-slate-50 text-slate-700">
          Nová rezervace
        </Button>
      </Card>
    </div>
  )
}