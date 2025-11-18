import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function SetupProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl bg-background/95 backdrop-blur-sm shadow-2xl">
        <div className="p-8">
          <div className="mb-8">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="text-center mb-8">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <div className="space-y-6">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
