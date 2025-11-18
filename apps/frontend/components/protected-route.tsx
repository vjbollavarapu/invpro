"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireSubscription?: boolean
}

export function ProtectedRoute({ children, requireSubscription = true }: ProtectedRouteProps) {
  const { user, subscription, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return

    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
      console.log("[v0] User not authenticated, redirecting to login")
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // Missing tenant - redirect to signup
    if (!user.tenantId) {
      console.log("[v0] User missing tenant, redirecting to signup")
      router.push("/tenant-signup")
      return
    }

    const profileCompleted = localStorage.getItem("profileCompleted")
    if (!profileCompleted && pathname !== "/setup-profile") {
      console.log("[v0] Profile not completed, redirecting to setup-profile")
      router.push("/setup-profile")
      return
    }

    // Check subscription status if required
    if (requireSubscription) {
      if (!subscription) {
        console.log("[v0] No subscription found, redirecting to subscription page")
        router.push("/subscription")
        return
      }

      if (subscription.status !== "active" && subscription.status !== "trial") {
        console.log("[v0] Subscription not active, redirecting to subscription page")
        router.push("/subscription")
        return
      }
    }
  }, [isLoading, isAuthenticated, user, subscription, requireSubscription, router, pathname])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!isAuthenticated || !user || !user.tenantId) {
    return null
  }

  // Check subscription if required
  if (requireSubscription && (!subscription || (subscription.status !== "active" && subscription.status !== "trial"))) {
    return null
  }

  // All checks passed, render children
  return <>{children}</>
}
