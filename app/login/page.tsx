'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase' // Import našeho klienta
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  // Funkce pro přihlášení
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Přihlášení úspěšné! Vítejte zpět.' })
      // Zde bychom normálně přesměrovali, např: router.push('/dashboard')
    }
    setLoading(false)
  }

  // Funkce pro registraci (pro testování)
  const handleSignUp = async () => {
    setLoading(true)
    setMessage(null)

    // Poznámka: Pokud máš v Supabase vypnuté "Confirm email", přihlásí tě to rovnou.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Testovací Uživatel', // Příklad metadat pro tabulku profiles
        },
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Registrace proběhla! Zkontroluj Supabase Users.' })
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Wellio SaaS</CardTitle>
          <CardDescription>Přihlášení do vývojové verze</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@salon.cz" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {message && (
              <div className={`p-3 text-sm rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Načítám...' : 'Přihlásit se'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={handleSignUp} disabled={loading} className="text-xs text-muted-foreground">
            Nemáte účet? Zaregistrovat (Test)
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}