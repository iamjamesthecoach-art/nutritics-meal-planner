"use client";

import { useState, useEffect, useCallback } from "react";
import { AppState, loadState, saveState, getDefaultState } from "@/lib/store";

export function useAppState() {
  const [state, setState] = useState<AppState>(getDefaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  return { state, update, loaded };
}
