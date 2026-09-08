# Floe

Floe is an independently maintained third-party theme for the Komari monitoring project.
It is built with **Next.js**, **TypeScript**, **Tailwind CSS** and **Shadcn UI** and packaged as a static site that can be used as a Komari theme.

[中文](./README-CN.md)

[Demo](https://komari.probe.name)

[Download theme file](https://github.com/lliooly/komari-theme-floe/releases/latest/download/dist-release.zip)

> This repository contains only the frontend. You will need a running Komari backend instance for the UI to talk to. Or you can download the theme file and upload it through Komari's admin dashboard, this would be the recommanded way.

![preview](https://github.com/lliooly/komari-theme-floe/blob/main/preview.png?raw=true)
![dark-theme](https://github.com/lliooly/komari-theme-floe/blob/main/images/dark-theme.png?raw=true)

## Features

- Map! Map! Map!
- Able to set settings in admin panel
- Remaining Value Calculator
- Real‑time dashboard for server and node status
- Instance detail pages with load and latency charts
- Node list and management views
- Internationalization (i18n) with `react-i18next`
- Responsive layout and dark mode using Shadcn + Tailwind CSS
- Theme packaging suitable for Komari's theme system
- **Extensive Customization Options:**
  - **6 Color Themes:** Default, Ocean, Sunset, Forest, Midnight, Rose
  - **4 Card Layouts:** Classic, Modern, Minimal, Detailed - each with unique visual designs and element positioning
  - **4 Graph Designs:** Circle, Progress Bar, Bar Chart, Minimal - all following the selected color theme
  - **Customizable Status Cards:** Show/hide individual metrics on the dashboard
  - **Bring your own background!** Use an image URL to set it as the background.
  - **Background Blur:** Add soft or glass blur effects to custom background images, with adjustable intensity.
  - **Card Blur:** Enable soft or glass card backgrounds, tune card transparency, and adjust extra blur separately.
  - The embedded Theme Settings page keeps its page background transparent while using the same card background and glass blur system as the homepage.
  - **Ping stats display** Show package information at homepage straight away!
  - All settings persist locally and sync across theme changes

## Tech Stack

- **Framework:** Next.js (App Router, static export)
- **Language:** TypeScript, React
- **UI:** Shadcn UI + Radix UI primitives, Tailwind CSS v4
- **Charts:** Recharts
- **State / Data:** Custom contexts, RPC2 client, fetch-based APIs

## Prerequisites

- **Node.js** 22 or newer (LTS recommended)
- A running **Komari backend** (API) reachable from the browser
- **Komari 1.2.1 or newer** for Floe's embedded custom Theme Settings page

## Getting Started

- Simply [download the theme file](https://github.com/lliooly/komari-theme-floe/releases/latest/download/dist-release.zip) and upload it through Komari's admin dashboard. This is the recommended way to install Floe.

## Dev

Clone this repository and install dependencies:

```bash
npm install
```

### Configure API target

The frontend talks to the Komari backend via `/api/*` rewrites configured in `next.config.ts`.  
Set the backend base URL using `NEXT_PUBLIC_API_TARGET`:

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_TARGET=http://127.0.0.1:25774
```

Adjust the URL to point to your Komari backend instance.

### Run in development

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Build for production / theme packaging

This project is configured for static export (`output: "export"` in `next.config.ts`), with the build output written to `dist/`.

```bash
npm run build
```

After the build completes:

- Serve the `dist` directory with any static web server, **or**
- Use the contents of `dist` as part of a Komari theme bundle.

## Nginx Production Optimization Tips

If you use Nginx or OpenResty as a reverse proxy, consider the following configuration to improve performance and avoid 404 responses for `HEAD` requests.

### 1. Handle HEAD requests (recommended)

Next.js prefetching and some CDNs, such as Tencent Cloud EdgeOne, may send frequent HTTP `HEAD` requests. Because the backend may not fully handle `HEAD`, you can convert those requests to `GET` at the Nginx layer before proxying them upstream:

```nginx
location / {
    # Convert HEAD to GET before proxying upstream to avoid prefetch 404s.
    if ($request_method = "HEAD") {
        rewrite_by_lua_block { ngx.req.set_method(ngx.HTTP_GET) } # OpenResty option
        # Or use: proxy_method GET; (pay attention to directive placement)
    }

    proxy_pass http://127.0.0.1:25774;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### 2. Enable Gzip compression

Gzip can significantly improve the loading speed of Next.js static assets:

```nginx
gzip on;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml;
gzip_vary on;
```

### 3. Security hardening

Consider using `fail2ban` to monitor Nginx logs and block large-scale malicious scans against paths such as `/api/rpc2` or `/instance/`.

These settings can improve navigation smoothness, make deployments more compatible with CDNs such as EdgeOne and Cloudflare, and reduce invalid 404 noise in browser consoles and Nginx logs.

## Theme Development

### Scheduled announcements

Sign in on the frontend and open Theme settings → Announcement management. Komari opens Floe's custom settings panel inside the admin content area. Floe provides a date/time picker, live preview and a Disable now button; the settings are saved as shared theme configuration for all visitors. This embedded Theme Settings page requires Komari 1.2.1 or newer.

The announcement stays pinned below navigation on the dashboard and instance pages as a separate glass island. Long content scrolls inside the banner. Headings, lists, links, code and tables are supported; HTML and images are disabled. Choose one of the four supported text colors: white, green, yellow or red. The banner hides at expiry while retaining its configuration. Empty content and invalid schedules remain hidden.

Open pages sync settings every 30 seconds, subject to network latency. Scheduling relies on the visitor device clock. This banner does not replace a separately hosted maintenance page during a full site outage.

This repository is designed to be used as a custom Komari theme.

1. Configure and customize the UI as needed.
2. Edit `komari-theme.json` to match your theme’s metadata and settings.
3. Build the project:

   ```bash
   npm run build
   ```

4. The static assets will be generated in the `dist` directory.  
   Combine them with `komari-theme.json` as required by Komari’s theme system and package them according to the Komari documentation.

## Scripts

- `npm run dev` – Start the Next.js development server
- `npm run build` – Build the static site into `dist/`
- `npm run lint` – Run ESLint over the project

## Contributing

Contributions are welcome.  
If you find issues or have ideas for improvements, feel free to open an issue or submit a pull request.

## Source and acknowledgements

Floe is an independently maintained third-party Komari theme. Part of its codebase is based on [Komari Next](https://github.com/tonyliuzj/komari-next), in tribute to its original author, Tony Liu. The UI, interaction details and future development of Floe are maintained independently by 豕豕豕. This project is not an official Komari or Komari Next release and does not represent either project's endorsement.

[Komari Next](https://github.com/tonyliuzj/komari-next) provided the initial technical foundation.
[piphase/komari-nexus](https://github.com/piphase/komari-nexus)
[fanchengliu/komari-next-pro](https://github.com/fanchengliu/komari-next-pro)
[Contributors](https://github.com/lliooly/komari-theme-floe/graphs/contributors)

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


## Local preview and settings concurrency

Run `npm run build`, then `npm run preview` (or `npm start`). The preview listens on
`http://127.0.0.1:3000`, serves `dist`, and forwards `/api` and `/themes` (including
WebSockets) to `NEXT_PUBLIC_API_TARGET` in `.env.local`, defaulting to
`http://127.0.0.1:25774`. Use `PORT` to change the preview port.

Settings writes have request timeouts and use Web Locks, where supported, to
serialize cooperating Floe tabs and embedded settings on the same origin.
Only edited fields are merged into the latest server settings. Failed theme
edits remain queued in the current page and the error notification offers a retry;
reload discards unsaved edits. Browsers without Web Locks only serialize writes
within each page. Different browsers/devices and other admin clients cannot share
this lock: Komari 1.2.1's settings API has no compare-and-swap/version precondition,
so concurrent writes from those clients still require a backend change for an
atomic guarantee. Avoid simultaneous editing from multiple devices.
