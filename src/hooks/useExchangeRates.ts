import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { FinanceData } from '../types';

export function useExchangeRates(
  cloudLoaded: boolean,
  setData: (fn: (prev: FinanceData) => FinanceData) => void,
  onUpdated: (at: string) => void,
) {
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!cloudLoaded || fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchRates() {
      try {
        const { data, error } = await supabase
          .from('exchange_rates')
          .select('usd_to_egp, gold_egp_per_gram, updated_at')
          .eq('id', 1)
          .single();

        if (error || !data) return;

        // Only apply if rates are fresh (within 72 hours)
        const ageHours = (Date.now() - new Date(data.updated_at).getTime()) / 3_600_000;
        if (ageHours > 72) return;

        setData(prev => ({
          ...prev,
          usdToEGP: Number(data.usd_to_egp),
          goldPricePerGram: Number(data.gold_egp_per_gram),
        }));

        const d = new Date(data.updated_at);
        onUpdated(d.toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' }) +
          ' · ' + d.toLocaleDateString('en-EG', { day: 'numeric', month: 'short' }));
      } catch {
        // Silently fail — user's stored rates are kept
      }
    }

    fetchRates();
  }, [cloudLoaded]); // eslint-disable-line
}
