import { Zap, Package, TrendingUp, FileText, AlertTriangle, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Zap,
    title: "Instant Sync",
    description: "Real-time updates across Shopify, Xero, and beyond. Your numbers match everywhere.",
  },
  {
    icon: Package,
    title: "Smart Tracking",
    description: "See exactly what's in, what's sold, and what's slipping - with low-stock alerts.",
  },
  {
    icon: FileText,
    title: "Zero-Bullshit Reports",
    description: "Get the numbers that matter. No jargon. No fluff. Just clarity.",
  },
  {
    icon: AlertTriangle,
    title: "No More Fire Drills",
    description: "Automated POs and alerts keep you two steps ahead, not two days behind.",
  },
  {
    icon: TrendingUp,
    title: "No More Guessing",
    description: "Real-time counts across every channel. Know what you can sell - before your customers do.",
  },
  {
    icon: RefreshCw,
    title: "No Spreadsheet Hell",
    description: "One dashboard, one source of truth, zero headaches.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-balance">
            Here's the WTF moment, InvPro360 just works.
          </h2>
          <p className="text-lg text-muted-foreground text-balance">
            Plug it in once. Watch your sales channels, stock counts, and purchase orders all sync - automatically. It's like having an ops manager who never sleeps, never complains, and actually knows math.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
