export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground">
          By using GameplanIT, you agree to use the platform responsibly and provide accurate information so plans can be personalized effectively.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Platform purpose</h2>
          <p className="text-muted-foreground">
            GameplanIT provides educational planning guidance and curated resources. It is not a guarantee of admission, employment, or academic outcomes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">User responsibilities</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>Provide truthful planning details.</li>
            <li>Use the platform in lawful and respectful ways.</li>
            <li>Do not attempt to access data that is not yours.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Updates</h2>
          <p className="text-muted-foreground">
            We may update these terms as the product evolves. Continued use after updates indicates acceptance.
          </p>
        </section>
      </div>
    </main>
  );
}
