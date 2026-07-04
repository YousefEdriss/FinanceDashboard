import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

type Column = 'finance' | 'daily';

const CACHE_PREFIX = 'dashboard_cache_';

export function useCloudStorage<T extends object>(column: Column, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedSnapshot = useRef('');
  const rowId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) setLoaded(true);
          return;
        }

        rowId.current = user.id;
        const cacheKey = `${CACHE_PREFIX}${user.id}_${column}`;

        const { data: row, error } = await supabase
          .from('dashboard_store')
          .select(column)
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (error) {
          // Supabase unavailable (project paused, network issue, etc.) — fall back to localStorage
          console.warn('[cloud] load failed, using local cache:', error.message);
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached) as Partial<T>;
              const merged = { ...defaultValue, ...parsed };
              setValue(merged as T);
              loadedSnapshot.current = JSON.stringify(merged);
            } catch {
              loadedSnapshot.current = JSON.stringify(defaultValue);
            }
          } else {
            loadedSnapshot.current = JSON.stringify(defaultValue);
          }
        } else {
          const stored = row ? (row as Record<string, unknown>)[column] as Partial<T> | undefined : undefined;

          if (stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
            const merged = { ...defaultValue, ...stored };
            setValue(merged as T);
            loadedSnapshot.current = JSON.stringify(merged);
            localStorage.setItem(cacheKey, JSON.stringify(stored));
          } else {
            loadedSnapshot.current = JSON.stringify(defaultValue);
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[cloud] init error:', err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    // Fallback: if Supabase never responds, unblock the UI after 12 seconds
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('[cloud] timeout — loading with defaults');
        setLoaded(true);
      }
    }, 12000);

    init().finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save — only if authenticated and data changed
  useEffect(() => {
    if (!loaded || !rowId.current) return;
    const current = JSON.stringify(value);
    if (current === loadedSnapshot.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const userId = rowId.current!;
      const cacheKey = `${CACHE_PREFIX}${userId}_${column}`;

      // Write to localStorage immediately so data survives Supabase outages
      localStorage.setItem(cacheKey, JSON.stringify(value));

      supabase
        .from('dashboard_store')
        .upsert({ id: userId, [column]: value })
        .then(({ error }) => {
          if (error) console.error('[cloud] save failed:', error.message);
          else loadedSnapshot.current = JSON.stringify(value);
        });
    }, 600);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [value, loaded, column]); // eslint-disable-line react-hooks/exhaustive-deps

  return [value, setValue, loaded] as const;
}
