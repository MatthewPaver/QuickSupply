import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | QuickSupply",
  description: "QuickSupply privacy policy and data handling",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Back to QuickSupply
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-GB")}</p>

        <div className="prose prose-sm mt-8 max-w-none dark:prose-invert">
          <h2 className="text-lg font-semibold mt-6">1. Who we are</h2>
          <p>
            QuickSupply is a supply teaching workforce scheduling application operated by Desian Education. This policy describes how we collect, use, and protect your data when you use the service.
          </p>

          <h2 className="text-lg font-semibold mt-6">2. Data we collect</h2>
          <p>
            We collect and process data necessary to run the service: account details (name, email, phone, role), cover requests and bookings, availability and preferences, and in-app notification history. We do not sell your data.
          </p>

          <h2 className="text-lg font-semibold mt-6">3. How we use it</h2>
          <p>
            Data is used to match schools with supply teachers, manage offers and assignments, send in-app and (when configured) email notifications, and improve the service. We use essential cookies for authentication and session management.
          </p>

          <h2 className="text-lg font-semibold mt-6">4. Retention</h2>
          <p>
            Account and booking data are retained while your account is active. Notification and audit-style data may be retained for a limited period (e.g. 90 days) for operational and support purposes. You can request access to or deletion of your data.
          </p>

          <h2 className="text-lg font-semibold mt-6">5. Your rights</h2>
          <p>
            You have the right to access the data we hold about you, to correct it, and to request deletion. Contact the agency or platform administrator for account deletion or data export requests.
          </p>

          <h2 className="text-lg font-semibold mt-6">6. Contact</h2>
          <p>
            For privacy-related questions, contact Desian Education or your agency administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
