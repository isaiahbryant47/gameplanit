export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground">
          GameplanIT is built to protect student and family information. We only collect information needed to generate and improve personalized learning plans.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">What we collect</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>Goal details (for example: subject, timeline, preferred outcomes).</li>
            <li>Planning constraints (schedule, budget, and transportation preferences).</li>
            <li>Basic account details when users create an account.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">How we use data</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>Generate personalized 12-week plans.</li>
            <li>Improve recommendations and resource matching.</li>
            <li>Provide anonymized, aggregate insights for partner organizations.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Data protection</h2>
          <p className="text-muted-foreground">
            We do not sell personal information. Partner reporting is anonymized and aggregated so individuals are not identified.
          </p>
        </section>
      </div>
    </main>
  );
}
