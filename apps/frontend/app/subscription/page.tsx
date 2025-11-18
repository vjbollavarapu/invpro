"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Loader2, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Plan {
  id: number
  name: string
  price: number
  features: string[]
}

const mockPlans: Plan[] = [
  {
    id: 1,
    name: "Starter",
    price: 49,
    features: ["1 Warehouse", "Basic Reports", "Email Support"],
  },
  {
    id: 2,
    name: "Pro",
    price: 99,
    features: ["5 Warehouses", "AI Forecasting", "Priority Support"],
  },
  {
    id: 3,
    name: "Enterprise",
    price: 199,
    features: ["Unlimited", "Automation Rules", "Dedicated Manager"],
  },
]

export default function SubscriptionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { updateSubscription } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/subscriptions/")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || mockPlans)
      } else {
        // Use mock data if API unavailable
        setPlans(mockPlans)
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error)
      // Use mock data if API unavailable
      setPlans(mockPlans)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async () => {
    if (!selectedPlan) {
      toast({
        title: "No plan selected",
        description: "Please select a subscription plan to continue.",
        variant: "destructive",
      })
      return
    }

    setActivating(true)

    try {
      const response = await fetch("/api/subscriptions/activate/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("invpro_token")}`,
        },
        body: JSON.stringify({ plan_id: selectedPlan }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.subscription) {
          updateSubscription(data.subscription)
        }

        toast({
          title: "Plan activated",
          description: "Your subscription has been activated successfully.",
        })
        // Redirect to payment or dashboard
        router.push("/dashboard")
      } else {
        const error = await response.json()
        toast({
          title: "Activation failed",
          description: error.message || "Failed to activate subscription plan.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while activating your plan.",
        variant: "destructive",
      })
    } finally {
      setActivating(false)
    }
  }

  const handleUpgradeLater = () => {
    const trialSubscription = {
      id: "trial-" + Date.now(),
      planId: 1,
      planName: "Trial",
      status: "trial" as const,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
    }
    updateSubscription(trialSubscription)

    toast({
      title: "Skipped subscription",
      description: "You can upgrade your plan anytime from settings.",
    })
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-accent">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-white" />
            <h1 className="text-3xl font-bold text-white">InvPro360</h1>
          </div>
          <p className="text-white/90 text-lg">Choose your subscription plan</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-white/90 text-sm font-medium">Step 3 of 4: Subscription</span>
          </div>
          <div className="w-full max-w-md mx-auto bg-white/20 rounded-full h-2">
            <div className="bg-white rounded-full h-2 transition-all duration-300" style={{ width: "75%" }} />
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-xl ${
                selectedPlan === plan.id
                  ? "border-2 border-accent ring-2 ring-accent/50"
                  : "border-2 border-transparent hover:border-accent/30"
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-primary">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  selectedPlan === plan.id ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPlan(plan.id)
                }}
              >
                {selectedPlan === plan.id ? "Selected" : "Select Plan"}
              </Button>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 min-w-[200px]"
            onClick={handleSelectPlan}
            disabled={!selectedPlan || activating}
          >
            {activating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activating...
              </>
            ) : (
              "Continue"
            )}
          </Button>

          <Button
            variant="link"
            className="text-white hover:text-white/80"
            onClick={handleUpgradeLater}
            disabled={activating}
          >
            Upgrade later
          </Button>
        </div>
      </div>
    </div>
  )
}
