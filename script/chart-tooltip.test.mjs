import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Recharts from "recharts";
import { createLoader } from "./test-utils.mjs";

const load = createLoader({}, {
  "@/lib/utils": createLoader()("src/lib/utils.ts"),
  recharts: {
    ...Recharts,
    // Server rendering has no layout measurements; render the chart contents directly.
    ResponsiveContainer: ({ children }) => children,
  },
});
const { ChartContainer, ChartTooltipContent } = load("src/components/ui/chart.tsx");
const { formatBytes } = createLoader()("src/utils/unitHelper.ts");

function renderTooltip(values, formatter) {
  const payload = values.map((value, index) => ({
    dataKey: `series-${index}`,
    name: `series-${index}`,
    value,
    payload: {},
  }));
  return renderToStaticMarkup(createElement(ChartContainer, {
    id: "tooltip-regression",
    config: {},
  }, createElement(ChartTooltipContent, { active: true, payload, formatter })));
}

test("tooltip formats zero values with latency, percentage and byte units", () => {
  for (const [format, expected] of [
    [(value) => `${value} ms`, "0 ms"],
    [(value) => `${value}%`, "0%"],
    [formatBytes, "0 B"],
  ]) {
    const calls = [];
    const html = renderTooltip([0], (value) => {
      calls.push(value);
      return format(value);
    });
    assert.deepEqual(calls, [0], expected);
    assert.ok(html.includes(`>${expected}</span>`), html);
  }
});

test("tooltip skips missing values while formatting zero and positive values", () => {
  const calls = [];
  const html = renderTooltip([null, undefined, 0, 42], (value) => {
    calls.push(value);
    return `${value} ms`;
  });
  assert.deepEqual(calls, [0, 42]);
  assert.ok(html.includes(">0 ms</span>"), html);
  assert.ok(html.includes(">42 ms</span>"), html);
  assert.doesNotMatch(html, /null ms|undefined ms/);
});
