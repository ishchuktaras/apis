'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scissors, CheckCircle } from 'lucide-react'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  // --- LOGIKA PŘIHLÁŠENÍ ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage({ type: 'error', text: 'Chyba: ' + error.message })
    } else {
      router.push('/dashboard/services')
    }
    setLoading(false)
  }

  // --- LOGIKA REGISTRACE ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: 'Nový Salon' } },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Účet vytvořen! Nyní se můžete přihlásit.' })
      // Volitelně můžeme rovnou přepnout na záložku přihlášení, ale zpráva stačí
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 text-2xl font-bold text-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
          <Scissors className="h-5 w-5" />
        </div>
        Salonio
      </div>

      {/* Přepínač Záložek */}
      <Tabs defaultValue="login" className="w-full max-w-[400px]">
        
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Přihlášení</TabsTrigger>
          <TabsTrigger value="register">Registrace</TabsTrigger>
        </TabsList>

        {/* --- ZÁLOŽKA PŘIHLÁŠENÍ --- */}
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Vítejte zpět</CardTitle>
              <CardDescription>Přihlaste se do svého salonu.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input id="email-login" type="email" placeholder="salon@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass-login">Heslo</Label>
                  <Input id="pass-login" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {message && message.type === 'error' && (
                  <div className="p-3 text-sm bg-red-50 text-red-700 rounded-md border border-red-200">{message.text}</div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Pracuji...' : 'Přihlásit se'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ZÁLOŽKA REGISTRACE --- */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Nový účet</CardTitle>
              <CardDescription>Začněte používat Salonio zdarma.</CardDescription>
            </CardHeader>
            <CardContent>
              {message && message.type === 'success' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Registrace úspěšná!</h3>
                    <p className="text-sm text-slate-500">Nyní se přepněte na Přihlášení.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-reg">Email</Label>
                    <Input id="email-reg" type="email" placeholder="admin@test.cz" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass-reg">Heslo</Label>
                    <Input id="pass-reg" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    <p className="text-[10px] text-muted-foreground">Minimálně 6 znaků.</p>
                  </div>
                  {message && message.type === 'error' && (
                    <div className="p-3 text-sm bg-red-50 text-red-700 rounded-md border border-red-200">{message.text}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Vytvářím účet...' : 'Vytvořit účet'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}