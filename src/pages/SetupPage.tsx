export function SetupPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-16">
      <div>
        <p className="font-display text-4xl text-ink">LifeLog</p>
        <h1 className="mt-4 text-lg text-ink">Firebase isn’t configured yet</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Copy <code>.env.example</code> to <code>.env</code> and add the web app keys from your Firebase project. Then restart the dev server.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-muted">
          <li>VITE_FIREBASE_API_KEY</li>
          <li>VITE_FIREBASE_AUTH_DOMAIN</li>
          <li>VITE_FIREBASE_PROJECT_ID</li>
          <li>VITE_FIREBASE_STORAGE_BUCKET</li>
          <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
          <li>VITE_FIREBASE_APP_ID</li>
        </ul>
      </div>
    </div>
  )
}
