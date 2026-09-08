import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
export function createLoader(globals = {}, mocks = {}) {
  const cache = new Map();
  const context = vm.createContext({
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    AbortController, AbortSignal, DOMException, Error, URL, fetch, ...globals,
  });
  function load(file) {
    file = resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const localRequire = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      if (specifier.startsWith(".")) return load(resolve(dirname(file), `${specifier}.ts`));
      return require(specifier);
    };
    vm.runInContext(`(function(require, module, exports) { ${code}\n})`, context)(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}

export const delay = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms));
export function untilAbort(signal) {
  return new Promise((_, reject) => {
    if (signal.aborted) reject(signal.reason);
    else signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
}
