import { useEffect } from "react";

export function shouldRevealImmediately(prefersReducedMotion: boolean, supportsIntersectionObserver: boolean) {
  return prefersReducedMotion || !supportsIntersectionObserver;
}

type RevealElement = HTMLElement;
type ObserverLike = Pick<IntersectionObserver, "observe" | "unobserve" | "disconnect">;

export function observeRevealElements(
  elements: RevealElement[],
  createObserver: (callback: IntersectionObserverCallback) => ObserverLike,
) {
  let observer: ObserverLike;
  observer = createObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  });

  elements.forEach((element) => {
    if (!element.classList.contains("is-visible")) observer.observe(element);
  });
  return () => observer.disconnect();
}

/** Reveals opted-in elements when they enter the viewport without hiding reduced-motion users. */
export function useScrollReveal(revision: string | number) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const supportsIntersectionObserver = typeof IntersectionObserver !== "undefined";

    if (shouldRevealImmediately(prefersReducedMotion, supportsIntersectionObserver)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    return observeRevealElements(elements, (callback) => new IntersectionObserver(callback, { rootMargin: "0px 0px -8%", threshold: 0.12 }));
  }, [revision]);
}
