import { useEffect } from "react";

interface SEOOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
}

export function useSEO({ title, description, canonicalPath }: SEOOptions) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    if (description) {
      descTag.setAttribute('content', description);
    }

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const origin = window.location.origin;
    if (canonicalPath) {
      canonical.setAttribute('href', origin + canonicalPath);
    } else {
      canonical.setAttribute('href', window.location.href);
    }
  }, [title, description, canonicalPath]);
}
