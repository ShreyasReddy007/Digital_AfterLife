import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    // The SessionProvider makes the session object available to all components.
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

