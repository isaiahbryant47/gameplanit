export default function Contact() {
  return (
    <main className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Contact</h1>
        <p className="text-muted-foreground">
          Questions about student plans, partnerships, or support? Reach us and we will follow up within 2 business days.
        </p>

        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">General support</p>
          <p className="text-lg font-semibold text-foreground">support@gameplanit.org</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">Partnership inquiries</p>
          <p className="text-lg font-semibold text-foreground">partners@gameplanit.org</p>
        </div>
      </div>
    </main>
  );
}
