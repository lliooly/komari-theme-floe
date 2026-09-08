import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createLoader, delay } from "./test-utils.mjs";

function fixture(file, view) {
  const pending = [], effects = [], setters = [];
  let slot = 0;
  const ast = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const mocks = {};
  for (const statement of ast.statements) {
    if (ts.isImportDeclaration(statement)) mocks[statement.moduleSpecifier.text] = {};
  }
  Object.assign(mocks, {
    react: {
      useEffect: (fn) => effects.push(fn),
      useState: (value) => {
        const index = slot++;
        return [value === "real-time" ? view : value, (next) => {
          setters[index] = typeof next === "function" ? next(setters[index] ?? value) : next;
        }];
      },
    },
    "next/dynamic": () => () => null,
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "@/contexts/LiveDataContext": { useLiveData: () => ({ onRefresh: () => () => {}, live_data: null }) },
    "@/contexts/NodeListContext": { useNodeList: () => ({ nodeList: [] }) },
    "@/contexts/PublicInfoContext": { usePublicInfo: () => ({ publicInfo: { record_preserve_time: 24 } }) },
    "@/utils/RecordHelper": { __esModule: true, default: () => [], liveDataToRecords: () => [] },
    "@/utils/unitHelper": { formatBytes: (value) => String(value) },
    "@/lib/request": { fetchJson: (url, options) => new Promise((resolve) => pending.push({ url, options, resolve })) },
  });
  const Component = createLoader({}, mocks)(file).default;
  return { pending, effects, setters, render: (props) => { slot = 0; Component(props); } };
}

test("instance initial data ignores a late response after switching nodes", async () => {
  const f = fixture("src/components/instance/InstancePage.tsx");
  f.render({ uuid: "a" });
  const cleanup = f.effects[0]();
  cleanup();
  f.render({ uuid: "b" });
  const cleanupB = f.effects[2]();
  try {
    const b = { updated_at: "2026-01-02T00:00:00Z" };
    f.pending[1].resolve({ data: [b] }); await delay();
    f.pending[0].resolve({ data: [{ updated_at: "2026-01-01T00:00:00Z" }] }); await delay();
    assert.equal(f.setters[0][0], b);
    assert.equal(f.pending[0].options.signal.aborted, true);
  } finally { cleanupB(); }
});

test("load chart ignores response and errors from a canceled request", async () => {
  const f = fixture("src/components/instance/LoadChart.tsx", "hours-24");
  f.render({ uuid: "a", data: [] });
  const cleanup = f.effects[1]();
  cleanup();
  f.pending[0].resolve({ data: { records: [{ time: "2026-01-01T00:00:00Z", cpu: 99 }] } });
  await delay();
  assert.equal(f.setters[1], null);
  assert.equal(f.pending[0].options.signal.aborted, true);
});
