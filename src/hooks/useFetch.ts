import { useEffect, useState } from "react";

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch(url)
      .then(async (res) => {
        if (!res.ok)
          throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const json = await res.json();
        if (mounted) setData(json);
      })
      .catch((e) => mounted && setError(e as Error))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [url]);

  return { data, error, loading };
}
