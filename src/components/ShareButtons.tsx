"use client";

import { useEffect, useMemo, useState } from "react";
import { Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, MessageCircle } from "lucide-react";

interface ShareButtonsProps {
  title?: string;
  text?: string;
  url?: string; // optional explicit URL; defaults to current page
  layout?: "inline" | "floating";
}

export default function ShareButtons({ title, text, url, layout = "inline" }: ShareButtonsProps) {
  const [pageUrl, setPageUrl] = useState<string>(url || "");

  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setPageUrl(window.location.href);
    }
  }, [url]);

  const shareData = useMemo(
    () => ({
      title: title || "Trek Hub India",
      text: text || "Explore guided Himalayan treks in India with certified experts.",
      url: pageUrl,
    }),
    [pageUrl, text, title]
  );

  const shareLinks = useMemo(() => {
    const encodedUrl = encodeURIComponent(shareData.url || "");
    const encodedText = encodeURIComponent(shareData.text || "");
    const encodedTitle = encodeURIComponent(shareData.title || "");

    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    };
  }, [shareData]);

  const handleNativeShare = async () => {
    try {
      if (navigator.share && shareData.url) {
        await navigator.share(shareData);
      } else {
        // fallback: copy url
        await navigator.clipboard.writeText(shareData.url || "");
        alert("Link copied to clipboard");
      }
    } catch (e) {
      // ignore if user cancels
    }
  };

  const containerClass = layout === "floating"
    ? "fixed z-40 right-4 bottom-20 flex flex-col gap-2"
    : "flex items-center gap-2";

  const buttonBase =
    "inline-flex items-center justify-center w-10 h-10 rounded-full border transition-colors bg-card/70 backdrop-blur border-border hover:border-primary";

  return (
    <div className={containerClass} aria-label="Share this page">
      <button
        onClick={handleNativeShare}
        className={`${buttonBase} text-foreground`}
        title="Share"
        aria-label="Share"
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Share</span>
      </button>
      <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className={`${buttonBase} text-[#1DA1F2]`} title="Share on X/Twitter" aria-label="Share on X/Twitter">
        <Twitter className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Share on X/Twitter</span>
      </a>
      <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className={`${buttonBase} text-[#1877F2]`} title="Share on Facebook" aria-label="Share on Facebook">
        <Facebook className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Share on Facebook</span>
      </a>
      <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className={`${buttonBase} text-[#0A66C2]`} title="Share on LinkedIn" aria-label="Share on LinkedIn">
        <Linkedin className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Share on LinkedIn</span>
      </a>
      <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className={`${buttonBase} text-[#25D366]`} title="Share on WhatsApp" aria-label="Share on WhatsApp">
        <MessageCircle className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Share on WhatsApp</span>
      </a>
      {/* Copy link fallback */}
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(shareData.url || "");
          alert("Link copied to clipboard");
        }}
        className={`${buttonBase} text-foreground`}
        title="Copy link"
      >
        <LinkIcon className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Copy link</span>
      </button>
    </div>
  );
}
