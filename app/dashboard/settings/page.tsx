// app/dashboard/settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Save, 
  CheckCircle2, 
  RotateCcw, 
  Loader2, 
  AlertTriangle, 
  Clock, 
  Store, 
  Palette, 
  Upload,
  User,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from "sonner" 

// --- TYPY ---
type TabType = 'hours' | 'profile' | 'branding'

type DaySchedule = {
  db_id?: string;
  day: string;
  dayIndex: number;
  isOpen: boolean;
  from: string;
  to: string;
}

// --- HLAVNÍ KOMPONENTA STRÁNKY ---
export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('hours');

  useEffect(() => {
    const init = async () => {
      // 1. Získání uživatele
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!user) {
         // Pokud není uživatel přihlášen, přesměrujeme na login
         window.location.href = '/login';
         return;
      } else {
         setUser(user);
      }
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
                <Loader2 className="animate-spin text-[#F4C430] w-10 h-10 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Načítám nastavení...</p>
            </div>
        </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 font-sans space-y-8 pb-24 animate-in fade-in">
      
      {/* HLAVIČKA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nastavení Salonu</h1>
          <p className="text-slate-500 mt-1">Spravujte profil, vzhled webu a otevírací dobu.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <User size={14} className="text-[#F4C430]" />
                <span className="max-w-[200px] truncate font-medium">{user?.email}</span>
            </div>
        </div>
      </div>

      {/* NAVIGACE */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<Store size={18} />} label="Profil & Kontakt" />
        <TabButton active={activeTab === 'hours'} onClick={() => setActiveTab('hours')} icon={<Clock size={18} />} label="Otevírací doba" />
        <TabButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={<Palette size={18} />} label="Vzhled Webu" />
      </div>

      {/* OBSAH */}
      <div className="mt-6">
        {activeTab === 'hours' && <BusinessHoursSettings userId={user?.id} />}
        {activeTab === 'profile' && <ProfileSettings userId={user?.id} email={user?.email} />}
        {activeTab === 'branding' && <BrandingSettings userId={user?.id} />}
      </div>
    </div>
  )
}

// --- MODUL 1: OTEVÍRACÍ DOBA ---
const INITIAL_SCHEDULE: DaySchedule[] = [
  { day: 'Pondělí', dayIndex: 1, isOpen: true, from: '09:00', to: '17:00' },
  { day: 'Úterý', dayIndex: 2, isOpen: true, from: '09:00', to: '17:00' },
  { day: 'Středa', dayIndex: 3, isOpen: true, from: '09:00', to: '17:00' },
  { day: 'Čtvrtek', dayIndex: 4, isOpen: true, from: '09:00', to: '17:00' },
  { day: 'Pátek', dayIndex: 5, isOpen: true, from: '09:00', to: '16:00' },
  { day: 'Sobota', dayIndex: 6, isOpen: false, from: '10:00', to: '14:00' },
  { day: 'Neděle', dayIndex: 0, isOpen: false, from: '09:00', to: '17:00' },
];

function BusinessHoursSettings({ userId }: { userId: string }) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(INITIAL_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        setLoading(true);
        if (!userId) return;

        const { data, error } = await supabase
            .from('business_hours')
            .select('*')
            .eq('user_id', userId)
            .order('day_of_week', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            const newSchedule = INITIAL_SCHEDULE.map(day => {
                const row = data.find((r: any) => r.day_of_week === day.dayIndex);
                if (row) {
                    return {
                        ...day,
                        db_id: row.id,
                        isOpen: !row.is_closed,
                        from: row.open_time.slice(0, 5),
                        to: row.close_time.slice(0, 5)
                    };
                }
                return day;
            });
            setSchedule(newSchedule);
        }
    } catch (e: any) {
        console.error(e);
        setError('Nepodařilo se načíst otevírací dobu: ' + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
      setIsSaving(true);
      setError(null);
      setSuccess(false);
      try {
          if (!userId) return;

          const updates = schedule.map(day => ({
              ...(day.db_id ? { id: day.db_id } : {}), 
              user_id: userId,
              day_of_week: day.dayIndex,
              open_time: `${day.from}:00`,
              close_time: `${day.to}:00`,
              is_closed: !day.isOpen
          }));

          const { data, error } = await supabase
              .from('business_hours')
              .upsert(updates, { onConflict: 'id' }) 
              .select();

          if (error) throw error;
          
          if (data) {
             const newSchedule = schedule.map(day => {
                 const saved = data.find((r: any) => r.day_of_week === day.dayIndex);
                 return saved ? { ...day, db_id: saved.id } : day;
             });
             setSchedule(newSchedule);
          }

          setSuccess(true);
          setHasUnsavedChanges(false);
          setTimeout(() => setSuccess(false), 3000);
      } catch (e: any) {
          console.error(e);
          setError('Chyba při ukládání: ' + e.message);
      } finally {
          setIsSaving(false);
      }
  };

  const updateDay = (idx: number, field: string, val: any) => {
      const copy = [...schedule];
      // @ts-ignore
      copy[idx][field] = val;
      setSchedule(copy);
      setHasUnsavedChanges(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
      <div className="space-y-6">
          {error && <ErrorBanner message={error} />}
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
            {hasUnsavedChanges && <div className="absolute top-0 left-0 right-0 h-1 bg-[#F4C430] animate-pulse" />}
            <div className="divide-y divide-slate-100">
                {schedule.map((item, index) => (
                    <div key={item.dayIndex} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${!item.isOpen ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'}`}>
                        <div className="flex items-center gap-4 min-w-[150px]">
                            <button 
                                onClick={() => updateDay(index, 'isOpen', !item.isOpen)} 
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:ring-offset-1 ${item.isOpen ? 'bg-slate-900' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className={`font-medium ${item.isOpen ? 'text-slate-900' : 'text-slate-400'}`}>{item.day}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {item.isOpen ? (
                                <>
                                    <input type="time" value={item.from} onChange={e => updateDay(index, 'from', e.target.value)} className="bg-white border border-slate-300 rounded-md px-2 py-1 text-sm focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] outline-none" />
                                    <span className="text-slate-400">-</span>
                                    <input type="time" value={item.to} onChange={e => updateDay(index, 'to', e.target.value)} className="bg-white border border-slate-300 rounded-md px-2 py-1 text-sm focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] outline-none" />
                                </>
                            ) : <span className="text-sm italic text-slate-400 font-medium px-4">Zavřeno</span>}
                        </div>
                    </div>
                ))}
            </div>
          </div>
          <SaveBar hasChanges={hasUnsavedChanges} isSaving={isSaving} onSave={handleSave} onDiscard={fetchData} />
          <SuccessToast show={success} />
      </div>
  );
}

// --- MODUL 2: PROFIL SALONU ---
function ProfileSettings({ userId, email }: { userId: string, email: string }) {
    const [profile, setProfile] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            if (!userId) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single(); 

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setProfile(data);
            } else {
                setProfile({ id: userId, email: email, salon_name: '', slug: '', address: '', phone: '' });
            }
        } catch (e: any) { 
             console.error(e); 
             setMsg({ type: 'error', text: 'Chyba načítání profilu: ' + e.message });
        } 
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            if (!userId) return;

            const { error } = await supabase
                .from('profiles')
                .upsert(profile, { onConflict: 'id' });

            if (error) throw error;
            
            setHasChanges(false);
            setMsg({ type: 'success', text: 'Profil byl úspěšně uložen.' });
            setTimeout(() => setMsg(null), 3000);
        } catch (e: any) {
            setMsg({ type: 'error', text: 'Chyba: ' + e.message });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, val: string) => {
        setProfile({ ...profile, [field]: val });
        setHasChanges(true);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            {msg && <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {msg.text}
            </div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 border-b pb-2">Základní údaje</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Název salonu</label>
                        <input type="text" value={profile.salon_name || ''} onChange={e => handleChange('salon_name', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-[#F4C430] focus:border-[#F4C430] outline-none transition-all" placeholder="Kadeřnictví..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">URL Slug (např. salon-jana)</label>
                        <input type="text" value={profile.slug || ''} onChange={e => handleChange('slug', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-[#F4C430] focus:border-[#F4C430] outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Popis</label>
                        <textarea rows={3} value={profile.description || ''} onChange={e => handleChange('description', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-[#F4C430] focus:border-[#F4C430] outline-none transition-all" />
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 border-b pb-2">Kontakt</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                        <input type="tel" value={profile.phone || ''} onChange={e => handleChange('phone', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-[#F4C430] focus:border-[#F4C430] outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adresa</label>
                        <input type="text" value={profile.address || ''} onChange={e => handleChange('address', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-[#F4C430] focus:border-[#F4C430] outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email (Login)</label>
                        <input type="text" disabled value={profile.email || ''} className="w-full p-2 border rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" />
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={!hasChanges || saving} className={`px-6 py-2 rounded-lg font-bold text-white transition-all flex items-center gap-2 ${hasChanges ? 'bg-[#1A1A1A] hover:bg-slate-800' : 'bg-slate-300 cursor-not-allowed'}`}>
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? 'Ukládám...' : 'Uložit Profil'}
                </button>
            </div>
        </div>
    );
}

// --- MODUL 3: VZHLED (BRANDING) ---
function BrandingSettings({ userId }: { userId: string }) {
    const [profile, setProfile] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            if (!userId) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            if (data) setProfile(data);
        } catch (e) { 
            console.error(e); 
        } 
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            if (!userId) return;

            const { error } = await supabase
                .from('profiles')
                .upsert({ 
                    id: userId, 
                    logo_url: profile.logo_url 
                }, { onConflict: 'id' });

            if (error) throw error;
            
            setHasChanges(false);
            setMsg({ type: 'success', text: 'Vzhled byl aktualizován.' });
            setTimeout(() => setMsg(null), 3000);
        } catch (e: any) {
            setMsg({ type: 'error', text: 'Chyba: ' + e.message });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, val: string) => {
        setProfile({ ...profile, [field]: val });
        setHasChanges(true);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            {msg && <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {msg.text}
            </div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* LOGO */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">Logo Salonu</h3>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer bg-white group">
                        {profile.logo_url ? (
                            <img src={profile.logo_url} alt="Logo" className="w-32 h-32 object-contain mb-4 group-hover:scale-105 transition-transform" onError={(e) => (e.currentTarget.src = '')} />
                        ) : (
                            <div className="w-24 h-24 bg-slate-50 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ImageIcon size={40} className="text-slate-300" />
                            </div>
                        )}
                        <label className="block w-full">
                            <span className="text-sm font-medium text-slate-700 mb-2 block">URL Adresa Loga</span>
                            <input 
                                type="text" 
                                value={profile.logo_url || ''} 
                                onChange={e => handleChange('logo_url', e.target.value)}
                                className="w-full text-center text-xs p-2 border rounded bg-slate-50 focus:bg-white focus:ring-[#F4C430] outline-none transition-all"
                                placeholder="https://..."
                            />
                        </label>
                        <p className="text-xs text-slate-400 mt-2">Zadejte přímý odkaz na obrázek.</p>
                    </div>
                </div>

                {/* BARVY */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">Barvy Webu</h3>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Primární barva</label>
                            <div className="flex items-center gap-3">
                                <input type="color" defaultValue="#F4C430" className="h-10 w-20 rounded cursor-pointer border-0 p-0" disabled />
                                <span className="text-slate-600 font-mono text-sm">#F4C430 (Výchozí)</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Změna barev bude dostupná v příští verzi DB schématu.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Cover Fotka</label>
                            <button disabled className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-sm font-medium cursor-not-allowed w-full justify-center">
                                <Upload size={16} /> Nahrávání dočasně vypnuto
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
                 <button onClick={handleSave} disabled={!hasChanges || saving} className={`px-6 py-2 rounded-lg font-bold text-white transition-all flex items-center gap-2 ${hasChanges ? 'bg-[#1A1A1A] hover:bg-slate-800' : 'bg-slate-300 cursor-not-allowed'}`}>
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? 'Ukládám...' : 'Uložit Vzhled'}
                </button>
            </div>
        </div>
    )
}

// --- UI KOMPONENTY ---
function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button onClick={onClick} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${active ? 'border-[#F4C430] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {icon} {label}
        </button>
    )
}

function LoadingSpinner() {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#F4C430]" size={32} /></div>
}

function ErrorBanner({ message }: { message: string }) {
    return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex gap-3 text-red-700">
            <AlertTriangle size={20} /> <span className="text-sm font-medium">{message}</span>
        </div>
    )
}

function SaveBar({ hasChanges, isSaving, onSave, onDiscard }: any) {
    return (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 transition-all duration-300 ${hasChanges ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
            <div className="bg-[#1A1A1A] text-white p-4 rounded-xl shadow-2xl flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-2 text-[#F4C430]"><RotateCcw size={20} /><span className="font-medium text-sm">Neuložené změny</span></div>
                <div className="flex gap-3">
                    <button onClick={onDiscard} disabled={isSaving} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Zahodit</button>
                    <button onClick={onSave} disabled={isSaving} className="px-6 py-2 rounded-lg text-sm font-bold bg-[#F4C430] text-[#1A1A1A] hover:bg-[#E0B120] flex gap-2 items-center transition-all">
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Uložit
                    </button>
                </div>
            </div>
        </div>
    )
}

function SuccessToast({ show }: { show: boolean }) {
  return (
    <div className={`fixed top-6 right-6 z-50 transition-all duration-500 transform ${show ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
      <div className="bg-white border-l-4 border-green-500 shadow-xl rounded-lg p-4 flex items-center gap-3 max-w-sm animate-in slide-in-from-right-5">
        <div className="bg-green-100 p-2 rounded-full text-green-600"><CheckCircle2 size={20} /></div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Uloženo!</h4>
          <p className="text-slate-500 text-xs">Změny byly úspěšně zapsány.</p>
        </div>
      </div>
    </div>
  )
}
