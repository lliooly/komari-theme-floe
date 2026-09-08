import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/utils/unitHelper.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { stringToBytes, formatBytes } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("preserves documented byte-size inputs", () => {
  for (const [input, expected] of [
    ["1MB", 1024 ** 2], ["1 MB", 1024 ** 2],
    ["5.4MB", Math.round(5.4 * 1024 ** 2)],
    ["6,222,765 MB", 6222765 * 1024 ** 2],
    ["128*1024gb", 128 * 1024 ** 4], ["1e3kb", 1000 * 1024],
    ["0.2gb", Math.round(0.2 * 1024 ** 3)], ["1024", 1024],
    ["1tb", 1024 ** 4], ["kb", 1024], [".5 GiB", 2 ** 29],
    ["2 * 3 * 4 MiB", 24 * 1024 ** 2], ["1e-3kb", 1],
    ["1E+3B", 1000], ["0gb", 0],
  ]) assert.equal(stringToBytes(input), expected, input);
});

test("supports every existing unit alias", () => {
  const groups = [
    ["b", "byte", "bytes"], ["k", "kb", "kib", "kilobyte"],
    ["m", "mb", "mib", "megabyte"], ["g", "gb", "gib", "gigabyte"],
    ["t", "tb", "tib", "terabyte"], ["p", "pb", "pib", "petabyte"],
  ];
  groups.forEach((aliases, power) => {
    for (const unit of aliases) assert.equal(stringToBytes(`1${unit}`), 1024 ** power);
  });
});

test("rejects executable input without side effects", () => {
  const key = "__floe_parser_probe";
  delete globalThis[key];
  try {
    for (const input of [
      `(this.${key}=73)gb`, `this.${key}=73`, "alert(1)gb",
      "(()=>1)()gb", "1;throw 1", "1/*comment*/gb", "2**10gb",
    ]) assert.equal(stringToBytes(input), 0, input);
    assert.equal(globalThis[key], undefined);
    assert.doesNotMatch(source, /new\s+Function\s*\(|\beval\s*\(/);
  } finally {
    delete globalThis[key];
  }
});

test("rejects invalid, negative, non-finite and unsafe sizes", () => {
  for (const input of [
    "", " ", null, undefined, 1024, "garbage", "1watts", "-1gb",
    "1/0gb", "Infinity", "NaN", "1e999gb", "0*1e999gb",
    "9007199254740992b", "9pb", "1e308*1e308", "1..2mb",
    "1e+mb", "*2gb", "2*gb", "2**3gb", "1".repeat(1025),
  ]) assert.equal(stringToBytes(input), 0, String(input));
});

test("keeps byte formatting unchanged", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1024), "1.00 KB");
  assert.equal(formatBytes(1024 ** 3), "1.00 GB");
});
