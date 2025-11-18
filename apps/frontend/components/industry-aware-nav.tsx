"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useIndustry } from "@/lib/hooks/useIndustry"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  DollarSign,
  Pill,
  Truck,
  Factory,
  Store,
  Users,
  FileText,
  Box,
} from "lucide-react"

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  DollarSign,
  Pill,
  Truck,
  Factory,
  Store,
  Users,
  FileText,
  Box,
}

export function IndustryAwareNav() {
  const pathname = usePathname()
  const { industry, loading, getNavigationItems } = useIndustry()

  if (loading) {
    return (
      <nav className="space-y-2">
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
      </nav>
    )
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="space-y-2">
      {navigationItems
        .filter(item => item.enabled)
        .map((item) => {
          const Icon = iconMap[item.icon] || Package
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
    </nav>
  )
}

