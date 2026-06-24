export function SupabaseConfigNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-6">
      <div className="max-w-lg rounded-2xl border border-sage-dark/40 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-forest mb-3">Configuration required</h1>
        <p className="text-sm text-charcoal-light leading-relaxed mb-4">
          Fore Beyond needs Supabase environment variables before it can load.
        </p>
        <ul className="text-sm text-charcoal-light space-y-2 mb-6 list-disc pl-5">
          <li>
            <code className="text-forest">NEXT_PUBLIC_SUPABASE_URL</code>
          </li>
          <li>
            <code className="text-forest">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </li>
        </ul>
        <p className="text-xs text-charcoal-light">
          Local: copy <code>.env.example</code> to <code>.env.local</code> and restart{" "}
          <code>npm run dev</code>. Vercel: add both variables under Project → Settings →
          Environment Variables, then redeploy.
        </p>
      </div>
    </div>
  );
}
