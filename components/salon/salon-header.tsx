import { Profile } from "@/types/salon"
import { MapPin, Phone, Scissors, Star } from "lucide-react"

interface SalonHeaderProps {
  profile: Profile
}

export function SalonHeader({ profile }: SalonHeaderProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-10 shadow-sm/50 backdrop-blur-sm bg-white/90 supports-[backdrop-filter]:bg-white/50">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            {profile.logo_url ? (
              <img 
                src={profile.logo_url} 
                alt={profile.salon_name} 
                className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border border-slate-200 shadow-sm bg-white"
              />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <Scissors className="h-6 w-6" />
              </div>
            )}
            
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                {profile.salon_name || 'Krásný Salon'}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center text-sm text-slate-500 mt-1 gap-1 sm:gap-4">
                {profile.address && (
                  <a href={`https://maps.google.com/?q=${profile.address}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                      <MapPin className="h-3 w-3" /> {profile.address}
                  </a>
                )}
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Phone className="h-3 w-3" /> {profile.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end">
             <div className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
               <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> 4.9
             </div>
             <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Ověřeno</span>
          </div>

        </div>
      </div>
    </header>
  )
}