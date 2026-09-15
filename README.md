# Floe

[![Build and Release Floe Theme](https://github.com/lliooly/komari-theme-floe/actions/workflows/build.yaml/badge.svg?branch=main)](https://github.com/lliooly/komari-theme-floe/actions/workflows/build.yaml)
[![MIT License](https://img.shields.io/github/license/lliooly/komari-theme-floe)](./LICENSE)

[中文](./README-CN.md)

[Demo](https://komari.probe.name) · [Download the latest theme package](https://github.com/lliooly/komari-theme-floe/releases/latest/download/dist-release.zip) · [All releases](https://github.com/lliooly/komari-theme-floe/releases)

Floe is an independently maintained third-party theme for [Komari](https://github.com/komari-monitor/komari). It is a static [Next.js](https://nextjs.org/) frontend that reads live data from a running Komari backend and can be installed through Komari's theme manager as a ZIP package.

> Floe is not an official Komari or Komari Next release and does not represent either project's endorsement.

![Floe preview](https://github.com/lliooly/komari-theme-floe/blob/main/preview.png?raw=true)

![Floe dark theme preview](https://github.com/lliooly/komari-theme-floe/blob/main/images/dark-theme.png?raw=true)

## Features

### Monitoring experience

- Live dashboard data with periodic refresh.
- Summary cards for current time, online nodes, regions, traffic and network speed.
- World map view for node locations.
- Node explorer with search, group filters, online/offline status, and grid or table view.
- Instance detail pages at <code>/instance/&lt;uuid&gt;</code> with load and latency charts.
- Optional Uptime Kuma status panel with service groups, status badges, heartbeat history, latest ping and 24-hour uptime.
- Remaining value calculator for deployments that expose pricing and expiration data.
- Responsive layout, dark mode, reduced-motion support and localized UI.

### Personalization

- Six color themes: Default, Ocean, Sunset, Forest, Midnight and Rose.
- Five card layouts: Classic, Modern, Minimal, Detailed and Compact.
- Alternate card and status designs, including latency history bars and speed gauges.
- Four graph designs: Circle, Progress Bar, Bar Chart and Minimal.
- Custom background images with mask, soft blur or glass blur controls.
- Card background transparency and blur controls.
- Per-card visibility, RAM/disk total display, guest price and expiration display.
- Node grid/table preference, custom logo URL and light/dark/system appearance.
- English, Simplified Chinese and Traditional Chinese interfaces.
- Local visitor preferences plus administrator-managed defaults shared by the Komari instance.

## Requirements

- Node.js 22 or newer for local development and packaging.
- A running Komari backend whose API is reachable from the browser.
- Komari 1.0.5 or newer for the native theme settings form.

## Install Floe

The recommended installation method is to use the prebuilt theme package:

1. [Download the latest <code>dist-release.zip</code>](https://github.com/lliooly/komari-theme-floe/releases/latest/download/dist-release.zip).
2. Open Komari's administrator dashboard and go to theme management.
3. Upload the ZIP package and activate Floe.

The release package contains <code>komari-theme.json</code>, <code>preview.png</code> and the static <code>dist/</code> directory. Upload the release package rather than the source repository.

## Develop locally

Clone the repository and install the locked dependency versions:

~~~bash
git clone https://github.com/lliooly/komari-theme-floe.git
cd komari-theme-floe
npm ci
~~~

### Configure the Komari API

Create <code>.env.local</code> in the project root when the backend is not available at the default address:

~~~env
NEXT_PUBLIC_API_TARGET=http://127.0.0.1:25774
~~~

<code>NEXT_PUBLIC_API_TARGET</code> is the backend base URL. Floe uses it for <code>/api/*</code> and <code>/themes/*</code> during development and local preview.

### Run the development server

~~~bash
npm run dev
~~~

Open <code>http://localhost:3000</code>. The Next.js development server rewrites the API and theme paths to <code>NEXT_PUBLIC_API_TARGET</code>.

These Next.js rewrites are development-only. The production build is a static export and does not include server-side rewrites.

### Preview a production build

~~~bash
npm run build
npm run preview
~~~

<code>npm start</code> is an equivalent entry point for the local preview server. The build is a static export written to <code>dist/</code>; the preview server serves that directory and proxies <code>/api</code>, <code>/themes</code> and their WebSocket upgrades to the configured Komari backend. Set <code>PORT</code> to use another local port:

~~~bash
PORT=3001 npm run preview
~~~

### Build the release package

~~~bash
bash build-theme.sh
~~~

The packaging script installs dependencies, builds the static site, validates <code>komari-theme.json</code>, checks the package contents and writes <code>dist-release.zip</code>. It requires <code>node</code>, <code>npm</code>, <code>jq</code>, <code>zip</code> and <code>unzip</code>.

## Theme settings and integrations

### Local preferences and administrator defaults

Visitors can use Floe's theme customizer to change presentation settings for their own browser. These preferences are stored locally.

Administrators can use Floe's native theme settings form in the Komari administrator dashboard to publish shared defaults for the instance. The form includes:

- Logo URL, default appearance and default language.
- Color, layout, card, graph, background and status-card settings.
- Guest-facing price and expiration visibility.
- Uptime Kuma configuration.
- Scheduled announcement management.

Only Komari administrators can edit shared settings.

### Scheduled announcements

Announcements are shared theme settings displayed below the navigation bar on the dashboard and instance pages. They support Markdown headings, lists, links, code and tables; raw HTML and images are disabled.

Administrators can enter the announcement content, start time, end time and text color. Start and end times use <code>YYYY-MM-DD HH:mm</code>, for example <code>2026-09-15 18:00</code>, interpreted using the site's UTC+08:00 convention; existing timestamps with an explicit timezone remain compatible. Empty content, invalid schedules and expired announcements remain hidden. Open pages refresh the announcement configuration approximately every 30 seconds.

### Uptime Kuma

Configure a public Uptime Kuma status page with its base URL and status-page slug. When enabled, Floe shows grouped services, operational state, heartbeat history, latest ping, 24-hour uptime and a link back to the status page.

## Deployment notes

- Floe is a static frontend. In production, serve it through Komari's same-origin theme entry or a correctly configured reverse proxy such as Nginx or Caddy; the exported site does not contain Next.js rewrites.
- Reverse proxies should forward <code>/api/*</code> and <code>/themes/*</code> to Komari and preserve WebSocket upgrades for <code>/api/rpc2</code>. The local <code>npm run preview</code> server provides the equivalent proxy for static-build checks.
- If a CDN or proxy sends <code>HEAD</code> requests that the backend answers with <code>404</code>, normalize those requests at the proxy or update the backend handling.
- Enable gzip or Brotli compression for static JavaScript, CSS and JSON assets where appropriate.
- Same-origin Floe tabs coordinate settings writes with Web Locks when the browser supports them. This does not coordinate different browsers, devices or other admin clients; avoid editing theme settings concurrently from multiple devices because Komari 1.2.1 does not provide a compare-and-swap version check.

## Commands

| Command | Purpose |
| --- | --- |
| <code>npm run dev</code> | Start the Next.js development server. |
| <code>npm run build</code> | Create the static export in <code>dist/</code>. |
| <code>npm run preview</code> / <code>npm start</code> | Serve <code>dist/</code> locally and proxy backend paths. |
| <code>npm run lint</code> | Run ESLint over <code>src/</code>. |
| <code>npm test</code> | Run the Node.js regression and security tests. |
| <code>npm run lint:workflows</code> | Validate GitHub Actions workflows. |
| <code>npm run i18n:validate</code> | Validate locale structure and placeholders. |
| <code>npm run i18n:check</code> | Require translations and the source snapshot to be synchronized. |
| <code>npm run i18n:sync:dry</code> | Preview translation changes without writing files or calling an API. |
| <code>npm run i18n:sync</code> | Generate and validate translation updates. |
| <code>bash build-theme.sh</code> | Build and verify <code>dist-release.zip</code>. |

## Repository layout

| Path | Role |
| --- | --- |
| <code>src/app/page.tsx</code> | Client-side routing for the dashboard and <code>/instance/&lt;uuid&gt;</code>. |
| <code>src/components/</code> | Dashboard, node, instance, settings and shared UI components. |
| <code>src/contexts/</code> and <code>src/lib/</code> | Live data, RPC2, theme settings, announcements and integration logic. |
| <code>src/i18n/locales/</code> | English, Simplified Chinese and Traditional Chinese translations. |
| <code>script/</code> | Preview server, tests, localization tools and build-time checks. |
| <code>komari-theme.json</code> | Komari theme metadata and native settings-form configuration. |
| <code>build-theme.sh</code> | Reproducible local theme-package build and validation. |

## CI and releases

The GitHub Actions build workflow runs locale validation, workflow checks, linting, tests, static export, theme metadata validation and ZIP verification for pull requests, <code>main</code> and version tags. Tags using the <code>vMAJOR.MINOR.PATCH</code> format publish the verified <code>dist-release.zip</code> package.

The translation workflow creates a reviewable pull request when source locale changes require synchronization. See [CI maintenance notes](./docs/ci-maintenance.md) for the repository's automation and release policies.

## Contributing

Issues and pull requests are welcome. Before submitting a change, run the checks relevant to your work, especially:

~~~bash
npm run lint
npm test
npm run build
~~~

When changing user-facing strings, also run the locale validation or synchronization commands. Keep <code>README.md</code> and <code>README-CN.md</code> aligned when changing user-facing project information.

## Acknowledgements

Floe is independently maintained by 豕豕豕. Its initial technical foundation was partly based on [Komari Next](https://github.com/tonyliuzj/komari-next). Thanks also to:

- [piphase/komari-nexus](https://github.com/piphase/komari-nexus)
- [fanchengliu/komari-next-pro](https://github.com/fanchengliu/komari-next-pro)
- [Floe contributors](https://github.com/lliooly/komari-theme-floe/graphs/contributors)

## License

Floe is released under the MIT License. The original copyright and license notice are preserved in [LICENSE](./LICENSE).

## Star History

<a href="https://www.star-history.com/?repos=lliooly%2Fkomari-theme-floe&type=date&legend=top-left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=lliooly/komari-theme-floe&type=date&theme=dark&legend=top-left" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=lliooly/komari-theme-floe&type=date&legend=top-left" />
    <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=lliooly/komari-theme-floe&type=date&legend=top-left" />
  </picture>
</a>
