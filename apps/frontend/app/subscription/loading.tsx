import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-accent">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  )
}
