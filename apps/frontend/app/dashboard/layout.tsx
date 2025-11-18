import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProtectedRoute } from "@/components/protected-route"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ProtectedRoute requireSubscription={false}>
        <div className="flex min-h-screen">
          <DashboardSidebar />
          <div className="flex-1 lg:pl-64">
            <DashboardHeader />
            <main className="p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </ProtectedRoute>
    </ErrorBoundary>
  )
}
