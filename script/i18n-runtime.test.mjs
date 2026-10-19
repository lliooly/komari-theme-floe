import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createInstance } from "i18next";
import { useTranslation } from "react-i18next";
import { createLoader } from "./test-utils.mjs";

test("project translations render through React after switching between all display languages", async () => {
  const instance = createInstance();
  const mocks = { i18next: { __esModule: true, default: instance } };
  for (const language of ["en", "zh_CN", "zh_TW"]) {
    mocks[`./locales/${language}.json`] = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, "utf8"),
    );
  }
  const { resources } = createLoader({}, mocks)("src/i18n/config.ts");
  function Labels() {
    const result = useTranslation(undefined, { i18n: instance });
    const [t] = result;
    return createElement("p", null, [
      result.t("login.title"),
      t("settings.title"),
      t("nodeCard.time_day"),
      t("missing.migration_check", { defaultValue: "Fallback label" }),
    ].join(" | "));
  }

  for (const language of ["en", "zh-CN", "zh-TW", "en"]) {
    await instance.changeLanguage(language);
    const translation = resources[language].translation;
    const markup = renderToStaticMarkup(createElement(Labels));
    assert.equal(markup, `<p>${[
      translation.login.title,
      translation.settings.title,
      translation.nodeCard.time_day,
      "Fallback label",
    ].join(" | ")}</p>`);
    assert.equal(
      instance.t("login.login_with", { provider: "GitHub" }),
      translation.login.login_with.replace("{{provider}}", "GitHub"),
    );
  }
});
