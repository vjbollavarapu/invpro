import { LandingNav } from "@/components/landing-nav"
import { LandingHero } from "@/components/landing-hero"
import { LandingFeatures } from "@/components/landing-features"
import { LandingPricing } from "@/components/landing-pricing"
import { LandingContact } from "@/components/landing-contact"
import { LandingFooter } from "@/components/landing-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingPricing />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  )
}

