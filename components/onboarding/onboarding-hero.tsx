interface OnboardingHeroProps {
  companyName: string
}

export function OnboardingHero({ companyName }: OnboardingHeroProps) {
  return (
    <section className="text-center py-8">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-balance">
        Välkommen, {companyName}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
        Låt oss hitta er perfekta pilot.
      </p>
    </section>
  )
}



