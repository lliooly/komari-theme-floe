"use client";

import { useEffect } from "react";
import { NATIVE_CORNER_SHAPE, NATIVE_RADIUS_SCALE, normalizeRadii, type CornerRadii, smoothBorder, smoothClip } from "@/lib/smoothCorners";

const marker = "data-smooth-corners";
const properties = ["--smooth-clip", "--smooth-border", "--smooth-tl", "--smooth-tr", "--smooth-br", "--smooth-bl"];
const corners = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"] as const;
type Surface = { radii: CornerRadii };

function finishRadiusTransitions(element: HTMLElement) {
  for (const animation of element.getAnimations()) {
    if ("transitionProperty" in animation && /^border-(?:(?:top|bottom)-(?:left|right)-)?radius$/.test(String(animation.transitionProperty))) {
      animation.finish();
    }
  }
}

/** One observer for the whole document, including Radix/Sonner portals. No React
 * state updates or per-card observers are needed when monitoring data changes. */
export default function SmoothCorners() {
  useEffect(() => {
    const nativeCorners = CSS.supports("corner-shape", NATIVE_CORNER_SHAPE);
    if (!nativeCorners && !CSS.supports("clip-path", "path('M 0 0 H 1 V 1 Z')")) return;

    const surfaces = new Map<HTMLElement, Surface>();
    const watched = new Set<HTMLElement>();
    const resizing = new Set<HTMLElement>();
    const pending = new Set<HTMLElement>();
    let frame = 0;
    let disposed = false;

    const clear = (element: HTMLElement) => {
      if (element.getAttribute(marker) !== "off") element.removeAttribute(marker);
      properties.forEach((property) => element.style.removeProperty(property));
      surfaces.delete(element);
    };

    const update = (element: HTMLElement) => {
      if (element.getAttribute(marker) === "off") {
        properties.forEach((property) => element.style.removeProperty(property));
        surfaces.delete(element);
        resize.unobserve(element);
        resizing.delete(element);
        return;
      }
      // Read the authored CSS, not the effective inset radii from our rule.
      element.removeAttribute(marker);
      // transition-all otherwise exposes an interpolated previous output here,
      // which would get scaled again on every refresh. Settle only the corner
      // transitions; preserve color, transform and telemetry animations.
      finishRadiusTransitions(element);
      const style = getComputedStyle(element);
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const raw = corners.map((corner) => style[corner]);
      let radii = raw.map((value) => parseFloat(value) || 0) as CornerRadii;
      // Observe only rounded surfaces, not every cell and icon in a large node
      // list. Hidden rounded surfaces stay observed so they recover on reveal.
      if (radii.some(Boolean)) {
        if (!resizing.has(element)) {
          resizing.add(element);
          resize.observe(element);
        }
      } else if (resizing.delete(element)) resize.unobserve(element);
      const shortest = Math.min(width, height);
      const pill = raw.every((value, i) => value.includes("%") ? parseFloat(value) >= 50 : radii[i] >= shortest / 2);
      if (!width || !height || !radii.some(Boolean) || pill ||
          raw.some((value) => value.includes("%") || value.includes(" ")) ||
          style.clipPath !== "none" || style.maskImage !== "none" ||
          element.closest('[data-smooth-corners="off"]')) {
        clear(element);
        return;
      }

      // Never clip shadows, focus rings, or visible overflow in older engines.
      // Those surfaces retain their original rounding when corner-shape is
      // unavailable. In particular, no inverse clipping is used as a workaround.
      if (!nativeCorners && (style.boxShadow !== "none" ||
          style.overflowX === "visible" || style.overflowY === "visible")) {
        clear(element);
        return;
      }

      // An explicitly inherited radius already has its parent's native scale.
      const inherited = element.classList.contains("rounded-[inherit]") || element.style.borderRadius === "inherit";
      if (nativeCorners && !inherited) radii.forEach((r, i) => { radii[i] = r * NATIVE_RADIUS_SCALE; });
      radii = normalizeRadii(width, height, radii);

      const rect = element.getBoundingClientRect();
      // Coordinate only corners that actually sit inside a parent's corner.
      // Controls in the middle of a card retain their authored radius.
      let parent = element.parentElement;
      while (parent && !surfaces.has(parent)) parent = parent.parentElement;
      const enclosing = parent ? surfaces.get(parent) : undefined;
      if (enclosing && parent) {
        // The parent may have scrolled since its geometry was last updated.
        const parentRect = parent.getBoundingClientRect();
        const gaps = [
          [rect.left - parentRect.left, rect.top - parentRect.top],
          [parentRect.right - rect.right, rect.top - parentRect.top],
          [parentRect.right - rect.right, parentRect.bottom - rect.bottom],
          [rect.left - parentRect.left, parentRect.bottom - rect.bottom],
        ];
        gaps.forEach(([x, y], i) => {
          const outer = enclosing.radii[i];
          if (x >= -0.5 && y >= -0.5 && x < outer && y < outer) {
            radii[i] = Math.min(radii[i], Math.max(0, outer - Math.max(x, y)));
          }
        });
      }

      if (!nativeCorners) {
        const widths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
        const colors = [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor];
        const styles = [style.borderTopStyle, style.borderRightStyle, style.borderBottomStyle, style.borderLeftStyle];
        const uniformBorder = parseFloat(widths[0]) > 0 && widths.every((v) => v === widths[0]) &&
          colors.every((v) => v === colors[0]) && styles.every((v) => v === "solid") && style.borderImageSource === "none";
        element.style.setProperty("--smooth-clip", smoothClip(width, height, radii));
        element.style.setProperty("--smooth-border", uniformBorder
          ? smoothBorder(width, height, radii, parseFloat(widths[0]), colors[0])
          : style.borderImage);
      }
      radii.forEach((radius, i) => element.style.setProperty(properties[i + 2], `${radius}px`));
      element.setAttribute(marker, nativeCorners ? "native" : "");
      finishRadiusTransitions(element);
      surfaces.set(element, { radii });
    };

    const watch = (root: HTMLElement) => {
      for (const element of [root, ...root.querySelectorAll<HTMLElement>("*")]) {
        if (!(element instanceof HTMLElement) || /^(SCRIPT|STYLE|LINK|META|BR)$/.test(element.tagName)) continue;
        pending.add(element);
        if (!watched.has(element)) {
          watched.add(element);
        }
      }
      schedule();
    };

    const observe = () => mutation.observe(document.body, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ["class", "style", "data-state", "data-smooth-corners"],
    });

    const flush = () => {
      frame = 0;
      // Own style writes must not feed the mutation observer back into itself.
      mutation.disconnect();
      for (const element of watched) {
        if (!element.isConnected) {
          resize.unobserve(element);
          resizing.delete(element);
          watched.delete(element);
          clear(element);
          pending.delete(element);
        }
      }
      // DOM order makes parent inset radii available before nested surfaces.
      const batch = [...pending].sort((a, b) => a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      pending.clear();
      batch.forEach(update);
      observe();
    };

    function schedule() {
      if (!frame && !disposed) frame = requestAnimationFrame(flush);
    }

    const resize = new ResizeObserver((entries) => {
      for (const { target } of entries) {
        if (target instanceof HTMLElement) {
          pending.add(target);
          // Resizing can change how a nested corner fits its parent.
          target.querySelectorAll<HTMLElement>(`[${marker}]`).forEach((child) => pending.add(child));
        }
      }
      schedule();
    });
    const mutation = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" && record.target instanceof HTMLElement) watch(record.target);
        else record.addedNodes.forEach((node) => { if (node instanceof HTMLElement) watch(node); });
      }
      // Also release references to removed surfaces.
      schedule();
    });
    const refresh = () => watch(document.body);
    observe();
    refresh();
    window.addEventListener("resize", refresh, { passive: true });
    // Theme classes live on <html>, outside the body observer.
    const theme = new MutationObserver(refresh);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    void document.fonts.ready.then(() => { if (!disposed) refresh(); });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      mutation.disconnect();
      theme.disconnect();
      resize.disconnect();
      window.removeEventListener("resize", refresh);
      watched.forEach(clear);
    };
  }, []);

  return null;
}
