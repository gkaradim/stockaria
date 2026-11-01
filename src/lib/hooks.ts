"use client";

import { useEffect, useState } from "react";
import { subscribe } from "./storage";
import { getSession, SESSION_EVENT, type Session } from "./session";

/** Runs an api function on mount and again whenever the browser store changes. */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    const run = () =>
      fn()
        .then((d) => alive && setData(d))
        .catch((e: Error) => alive && setError(e));
    run();
    const unsubscribe = subscribe(run);
    return () => {
      alive = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading: data === undefined && !error };
}

/** undefined while mounting (avoids hydration mismatch), null when logged out. */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    const read = () => setSession(getSession());
    read();
    window.addEventListener(SESSION_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(SESSION_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return session;
}
