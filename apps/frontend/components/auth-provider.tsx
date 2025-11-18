"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  tenantId: string
  role: string
}

interface Subscription {
  id: string
  planId: number
  planName: string
  status: "active" | "inactive" | "trial" | "cancelled"
  expiresAt: string
}

interface Tenant {
  id: string
  name: string
}

interface AuthContextType {
  user: User | null
  subscription: Subscription | null
  currentTenant: Tenant | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateSubscription: (subscription: Subscription) => void
  checkAuth: () => Promise<boolean>
  switchTenant: (tenantId: string, tenantName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("invpro_token")
      const storedUser = localStorage.getItem("invpro_user")
      const storedSubscription = localStorage.getItem("invpro_subscription")
      const storedTenant = localStorage.getItem("invpro_current_tenant")

      if (!token || !storedUser) {
        setIsLoading(false)
        return false
      }

      // Parse stored data
      const userData = JSON.parse(storedUser)
      const subscriptionData = storedSubscription ? JSON.parse(storedSubscription) : null
      const tenantData = storedTenant ? JSON.parse(storedTenant) : null

      // Verify token with backend (placeholder)
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(tenantData?.id && { "X-Tenant-ID": tenantData.id }),
        },
      })

      if (!response.ok) {
        // Token invalid, clear storage
        localStorage.removeItem("invpro_token")
        localStorage.removeItem("invpro_user")
        localStorage.removeItem("invpro_subscription")
        localStorage.removeItem("invpro_current_tenant")
        setIsLoading(false)
        return false
      }

      const verifyData = await response.json()

      setUser(verifyData.user || userData)
      setSubscription(verifyData.subscription || subscriptionData)
      setCurrentTenant(verifyData.tenant || tenantData)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error("[v0] Auth check failed:", error)
      setIsLoading(false)
      return false
    }
  }

  const login = (token: string, userData: User & { tenantName?: string }) => {
    localStorage.setItem("invpro_token", token)
    localStorage.setItem("invpro_user", JSON.stringify(userData))
    setUser(userData)
    const initialTenant = { 
      id: userData.tenantId, 
      name: userData.tenantName || "Current Tenant" 
    }
    localStorage.setItem("invpro_current_tenant", JSON.stringify(initialTenant))
    setCurrentTenant(initialTenant)
  }

  const logout = () => {
    localStorage.removeItem("invpro_token")
    localStorage.removeItem("invpro_user")
    localStorage.removeItem("invpro_subscription")
    localStorage.removeItem("invpro_current_tenant")
    setUser(null)
    setSubscription(null)
    setCurrentTenant(null)
    router.push("/login")
  }

  const updateSubscription = (subscriptionData: Subscription) => {
    localStorage.setItem("invpro_subscription", JSON.stringify(subscriptionData))
    setSubscription(subscriptionData)
  }

  const switchTenant = async (tenantId: string, tenantName: string) => {
    try {
      const newTenant = { id: tenantId, name: tenantName }
      localStorage.setItem("invpro_current_tenant", JSON.stringify(newTenant))
      setCurrentTenant(newTenant)

      // Update user's tenantId
      if (user) {
        const updatedUser = { ...user, tenantId }
        localStorage.setItem("invpro_user", JSON.stringify(updatedUser))
        setUser(updatedUser)
      }

      // Refresh the page to load new tenant's data
      window.location.reload()
    } catch (error) {
      console.error("[v0] Failed to switch tenant:", error)
    }
  }

  const value: AuthContextType = {
    user,
    subscription,
    currentTenant,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateSubscription,
    checkAuth,
    switchTenant,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
