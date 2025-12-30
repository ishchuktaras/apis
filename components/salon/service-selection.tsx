import { Service } from "@/types/salon"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Clock, Scissors } from "lucide-react"

interface ServiceSelectionProps {
  services: Service[]
  selectedServiceId: string | null
  onSelect: (id: string) => void
}

export function ServiceSelection({ services, selectedServiceId, onSelect }: ServiceSelectionProps) {
  return (
    <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800">
          <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">1</span> Vyberte službu
          </h2>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Krok 1/3</span>
      </div>
      
      <div className="grid gap-3">
        {services.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Scissors className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">Tento salon zatím nemá nastavené žádné služby.</p>
            </div>
        ) : (
            services.map(service => (
              <Card key={service.id} 
                className={`cursor-pointer border transition-all duration-200 group ${selectedServiceId === service.id ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-md' : 'border-slate-200 bg-white hover:border-primary/50 hover:shadow-sm'}`}
                onClick={() => onSelect(service.id)}
              >
                <CardContent className="p-5 flex justify-between items-center">
                  <div>
                    <h3 className={`font-semibold text-lg ${selectedServiceId === service.id ? 'text-primary' : 'text-slate-900'}`}>{service.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                       <div className="flex items-center text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Clock className="h-3 w-3 mr-1" /> {service.duration_minutes} min 
                       </div>
                       <span className="font-bold text-slate-900">{service.price} Kč</span>
                    </div>
                    {service.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{service.description}</p>}
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedServiceId === service.id ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-transparent'}`}>
                      {selectedServiceId === service.id && <Check className="h-3 w-3" />}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </section>
  )
}