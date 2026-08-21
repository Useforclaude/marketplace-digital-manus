import { describe, expect, it, vi } from "vitest";
import { observeRevealElements, shouldRevealImmediately } from "./useScrollReveal";

describe("scroll reveal fallback policy", () => {
  it("keeps motion enabled when IntersectionObserver is available and reduced motion is off", () => {
    expect(shouldRevealImmediately(false, true)).toBe(false);
  });

  it("reveals immediately for reduced motion or browsers without IntersectionObserver", () => {
    expect(shouldRevealImmediately(true, true)).toBe(true);
    expect(shouldRevealImmediately(false, false)).toBe(true);
  });

  it("observes hidden elements, reveals only after intersection, then cleans up the observer", () => {
    const classes = new Set<string>(["reveal"]);
    const element = { classList: { add: (value: string) => classes.add(value), contains: (value: string) => classes.has(value) } } as unknown as HTMLElement;
    let callback: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const unobserve = vi.fn();
    const disconnect = vi.fn();
    const cleanup = observeRevealElements([element], (receivedCallback) => {
      callback = receivedCallback;
      return { observe, unobserve, disconnect };
    });

    expect(observe).toHaveBeenCalledWith(element);
    expect(classes.has("is-visible")).toBe(false);
    callback?.([{ isIntersecting: true, target: element } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(classes.has("is-visible")).toBe(true);
    expect(unobserve).toHaveBeenCalledWith(element);
    cleanup();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
