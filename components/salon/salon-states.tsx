import { Info } from "lucide-react"
import Link from "next/link"

export function SalonLoading() {
  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      <header className="bg-card border-b p-4">
        <div className="h-16 w-16 bg-muted rounded-full animate-pulse mx-auto mb-2"></div>
        <div className="h-6 w-48 bg-muted rounded animate-pulse mx-auto"></div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-card rounded-xl border shadow-sm animate-pulse"></div>
        ))}
      </main>
    </div>
  )
}

interface SalonErrorProps {
  message: string
}

export function SalonError({ message }: SalonErrorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-destructive font-medium p-4 text-center">
      <Info className="h-10 w-10 mb-4" />
      {message}
      <Link href="/" className="mt-4 text-primary underline">
        Zpět na hlavní stránku
      </Link>
    </div>
  )
}