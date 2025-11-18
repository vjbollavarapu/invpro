import { Package, TrendingUp, Warehouse, Users, BarChart3, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description: "Track stock levels, manage SKUs, and automate reordering with real-time inventory insights.",
  },
  {
    icon: TrendingUp,
    title: "Procurement & Sales",
    description: "Streamline purchasing workflows and sales orders with integrated procurement management.",
  },
  {
    icon: Warehouse,
    title: "Shared Warehouses",
    description: "Manage multiple warehouse locations with shared inventory and cross-location transfers.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Enable seamless collaboration with role-based access and real-time updates for your team.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Make data-driven decisions with comprehensive analytics and customizable reporting tools.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level security with encrypted data, audit logs, and compliance-ready infrastructure.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-balance">
            Everything you need to manage your inventory
          </h2>
          <p className="text-lg text-muted-foreground text-balance">
            Powerful features designed to streamline your warehouse operations and boost productivity.
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
