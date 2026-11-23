import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Hero } from "@/components/landing/hero";
import { HowSection, OfferSection, PricesSection, ProblemsSection, PromiseSection, WorkerBand } from "@/components/landing/sections";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <SiteHeader />
      <Hero />
      <ProblemsSection />
      <HowSection />
      <PricesSection />
      <OfferSection />
      <PromiseSection />
      <WorkerBand />
      <SiteFooter />
    </main>
  );
}
