import { getSvgPath } from "figma-squircle";

// Figma's iOS-style smoothing. Keep this shared by every surface and border.
export const CORNER_SMOOTHING = 0.6;
export type CornerRadii = [number, number, number, number]; // TL, TR, BR, BL

export function smoothPath(width: number, height: number, radii: CornerRadii) {
  return getSvgPath({
    width,
    height,
    topLeftCornerRadius: radii[0],
    topRightCornerRadius: radii[1],
    bottomRightCornerRadius: radii[2],
    bottomLeftCornerRadius: radii[3],
    cornerSmoothing: CORNER_SMOOTHING,
    // Let very small surfaces reduce smoothing rather than distort their corners.
    preserveSmoothing: false,
  });
}

export function insetRadii(radii: CornerRadii, inset: number): CornerRadii {
  return radii.map((radius) => Math.max(0, radius - inset)) as CornerRadii;
}

export function smoothClip(width: number, height: number, radii: CornerRadii) {
  // Keep the exterior of the original rounded contour, not just the rectangle:
  // focus rings and shadows occupy the area *inside* its corner bounding boxes
  // too. Cutting those boxes would leave four visible breaks in a focus ring.
  const exterior = "M -100000 -100000 H 100000 V 100000 H -100000 Z";
  const original = getSvgPath({
    width, height, cornerSmoothing: 0,
    topLeftCornerRadius: radii[0], topRightCornerRadius: radii[1],
    bottomRightCornerRadius: radii[2], bottomLeftCornerRadius: radii[3],
  });
  return `path(evenodd, '${exterior} ${original} ${smoothPath(width, height, radii)}')`;
}

export function smoothBorder(
  width: number,
  height: number,
  radii: CornerRadii,
  thickness: number,
  color: string,
) {
  const outer = smoothPath(width, height, radii);
  const innerWidth = width - 2 * thickness;
  const innerHeight = height - 2 * thickness;
  const inner = innerWidth > 0 && innerHeight > 0
    ? `<path d="${smoothPath(innerWidth, innerHeight, insetRadii(radii, thickness))}" transform="translate(${thickness} ${thickness})" fill="black"/>`
    : "";
  // A filled border-image center paints the SVG over the background without
  // adding a wrapper/pseudo-element or changing border widths and layout.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><mask id="b"><path d="${outer}" fill="white"/>${inner}</mask></defs><path d="${outer}" fill="${color.replaceAll('"', '&quot;')}" mask="url(#b)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 fill / 0 / 0 stretch`;
}
