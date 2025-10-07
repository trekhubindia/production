"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";

// Lazy import the heavy chatbot only after user intent
const LazyFloatingChatbot = dynamic(() => import("@/components/FloatingChatbot"), {
  ssr: false,
  loading: () => null,
});

export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const onOpen = useCallback(() => {
    setOpen(true);
    // Mount the heavy component only after the first open
    if (!mounted) setMounted(true);
  }, [mounted]);

  const onClose = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* Lightweight FAB visible by default */}
      {!open && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-[1200] rounded-full bg-blue-600 text-white w-12 h-12 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Render chatbot only after first interaction */}
      {mounted && <LazyFloatingChatbot autoOpen={open} />}
    </>
  );
}
