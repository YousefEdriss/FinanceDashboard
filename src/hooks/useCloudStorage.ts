import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

type Column = 'finance' | 'daily';

export function useCloudStorage<T extends object>(column: Column, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedSnapshot = useRef('');

  // Load from cloud once on mount
  useEffect(() => {
    supabase
      .from('dashboard_store')
      .select(column)
      .eq('id', 'main')
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const stored = (data as Record<string, unknown>)[column] as Partial<T> | undefined;
          if (stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
            const merged = { ...defaultValue, ...stored };
            setValue(merged as T);
            loadedSnapshot.current = JSON.stringify(merged);
          } else {
            loadedSnapshot.current = JSON.stringify(defaultValue);
          }
        } else {
          loadedSnapshot.current = JSON.stringify(defaultValue);
        }
        setLoaded(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to cloud on every change, debounced — skip if it matches what we just loaded
  useEffect(() => {
    if (!loaded) return;
    const current = JSON.stringify(value);
    if (current === loadedSnapshot.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase
        .from('dashboard_store')
        .update({ [column]: value })
        .eq('id', 'main')
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
