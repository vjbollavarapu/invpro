"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, CheckCircle2, Loader2, Building2, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") || ""
  const [email, setEmail] = useState(emailParam)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState("")

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setResending(true)
    setError("")

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification email")
      }

      setResent(true)
      setTimeout(() => setResent(false), 5000)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-accent p-4">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">InvPro360</h1>
          <p className="text-white/80 text-sm">Inventory & Warehouse Management</p>
        </div>

        {/* Verify email card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">Verify your email</h2>
              <p className="text-muted-foreground text-sm">Enter your email to receive a verification link</p>
            </div>

            {resent && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  Verification email sent successfully! Check your inbox.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={resending}
                  />
                </div>
              </div>

              <Button onClick={handleResend} className="w-full" disabled={resending || !email}>
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending verification email...
                  </>
                ) : (
                  "Send verification email"
                )}
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm space-y-2">
              <p className="font-medium">What happens next?</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Complete your profile setup</li>
                <li>Start using InvPro360</li>
              </ol>
            </div>

            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/60 mt-6">
          Need help?{" "}
          <a href="mailto:support@invpro360.com" className="underline hover:text-white/80">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-accent">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
