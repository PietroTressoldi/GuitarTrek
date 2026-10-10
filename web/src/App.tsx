// 🎸 Sua vez! Siga o roteiro do chat para transformar isto num card de status da API.
import { useEffect, useState } from "react"
import { Badge } from "./components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"

type Health = { status: string, database: boolean }

function App() {

  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: Health) => setHealth(data))
      .catch((err) => setError(err.message))
  }, [])

  return <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">🎸 GuitarTrek</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
         {error && <p className="text-red-500">API fora do ar 😢</p>}
          {!health && !error && <p className="text-neutral-500">Verificando...</p>}
          {health && (
            <>
              <Status label="API" ok={health.status === 'ok'} />
              <Status label="Banco de dados" ok={health.database} />
            </>
          )}
        </CardContent>
    </Card>
  </main>
}

// Um segundo componente, reaproveitado duas vezes. "props" = parâmetros do componente
function Status({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <Badge variant={ok ? 'default' : 'destructive'}>{ok ? 'online' : 'offline'}</Badge>
    </div>
  )
}

export default App
