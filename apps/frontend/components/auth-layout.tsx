import type React from "react"
import Link from "next/link"
import { Package } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-5 w-5" />
            </div>
            <span>InvPro360</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-balance">Streamline your inventory management with InvPro360</h2>
          <p className="text-lg text-primary-foreground/90 leading-relaxed">
            Join thousands of businesses managing their inventory, procurement, and warehouse operations efficiently.
          </p>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Real-time tracking</p>
                <p className="text-sm text-primary-foreground/80">Monitor inventory across all locations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Automated workflows</p>
                <p className="text-sm text-primary-foreground/80">Save time with intelligent automation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Advanced analytics</p>
                <p className="text-sm text-primary-foreground/80">Make data-driven decisions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -left-20 -top-20 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl" />
      </div>
    </div>
  )
}
