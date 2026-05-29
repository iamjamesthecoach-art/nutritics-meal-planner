"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
    setDismissed(true);
  };

  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#7C4DFF] to-[#6C3FC5] text-white px-4 py-3 flex items-center justify-between shadow-lg">
      {isIOS ? (
        <p className="text-sm flex-1">
          Tap{" "}
          <svg
            className="inline w-4 h-4 -mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12l7-7 7 7" />
            <rect x="4" y="18" width="16" height="2" rx="1" />
          </svg>{" "}
          then <strong>&quot;Add to Home Screen&quot;</strong>
        </p>
      ) : (
        <p className="text-sm flex-1">Add to your home screen for the best experience</p>
      )}
      {!isIOS && (
        <button
          onClick={handleInstall}
          className="ml-3 px-3 py-1.5 bg-white text-[#6C3FC5] rounded-lg text-sm font-bold whitespace-nowrap"
        >
          Install
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 text-white/80 text-lg leading-none"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
