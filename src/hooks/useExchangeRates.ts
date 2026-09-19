import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { FinanceData } from '../types';

interface Rates {
  usdToEGP: number;
  goldEGPPerGram: number;
}

function formatTimestamp(isoString: string) {
  const d = new Date(isoString);
  return (
    d.toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' }) +
    ' · ' +
    d.toLocaleDateString('en-EG', { day: 'numeric', month: 'short' })
  );
}

export function useExchangeRates(
  cloudLoaded: boolean,
  setData: (fn: (prev: FinanceData) => FinanceData) => void,
) {
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fetchedRef = useRef(false);

  // Apply rates to dashboard state and record when they were fetched
  function applyRates(rates: Rates, timestamp: string) {
    setData(prev => ({
      ...prev,
      usdToEGP: rates.usdToEGP,
      goldPricePerGram: rates.goldEGPPerGram,
    }));
    setUpdatedAt(formatTimestamp(timestamp));
  }

  // On load: read the latest rates already in Supabase (written by last cron run)
  useEffect(() => {
    if (!cloudLoaded || fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadCached() {
      try {
        const { data, error } = await supabase
          .from('exchange_rates')
          .select('usd_to_egp, gold_egp_per_gram, updated_at')
          .eq('id', 1)
          .single();

        if (error || !data) return;

        const ageHours = (Date.now() - new Date(data.updated_at).getTime()) / 3_600_000;
        if (ageHours > 72) return; // stale — don't apply

        applyRates(
          { usdToEGP: Number(data.usd_to_egp), goldEGPPerGram: Number(data.gold_egp_per_gram) },
          data.updated_at,
        );
      } catch {
        // silent — user's stored rates are kept
      }
    }

    loadCached();
  }, [cloudLoaded]); // eslint-disable-line

  // Manual refresh: calls the Edge Function for live rates right now
  const refreshNow = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke<Rates>('fetch-rates');
      if (error || !data) throw error ?? new Error('No data');
      applyRates(data, new Date().toISOString());
    } catch (err) {
      console.error('[rates] manual refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, []); // eslint-disable-line

  return { updatedAt, refreshing, refreshNow };
}
