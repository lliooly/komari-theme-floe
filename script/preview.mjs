import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const mimeTypes = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

export function createPreviewServer({ directory = "dist", target = process.env.NEXT_PUBLIC_API_TARGET || "http://127.0.0.1:25774" } = {}) {
  const root = resolve(directory);
  const isBackendPath = (pathname) => /^\/(api|themes)(\/|$)/.test(pathname);
  const proxy = createProxyMiddleware({ target, changeOrigin: true, proxyTimeout: 30_000 });
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (isBackendPath(pathname)) {
        proxy(req, res);
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { Allow: "GET, HEAD" }).end();
        return;
      }
      const isPage = pathname === "/" || /^\/settings\/?$/.test(pathname) || /^\/instance\/[^/]+\/?$/.test(pathname);
      const file = resolve(root, isPage ? "index.html" : `.${pathname}`);
      if (!file.startsWith(root + sep) || pathname.split("/").some((part) => part.startsWith("."))) {
        res.writeHead(403).end();
        return;
      }
      const resolvedFile = await realpath(file);
      const resolvedRoot = await realpath(root);
      if (!resolvedFile.startsWith(resolvedRoot + sep) || !(await stat(resolvedFile)).isFile()) {
        res.writeHead(403).end();
        return;
      }
      const body = await readFile(resolvedFile);
      res.writeHead(200, {
        "Content-Type": mimeTypes[extname(file)] || "application/octet-stream",
        "Content-Length": body.length,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch (error) {
      res.writeHead(error instanceof URIError ? 400 : error.code === "ENOENT" ? 404 : 500).end();
    }
  });
  server.on("upgrade", (req, socket, head) => {
    if (isBackendPath(new URL(req.url, "http://localhost").pathname)) proxy.upgrade(req, socket, head);
    else socket.destroy();
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await stat("dist/index.html").catch(() => { throw new Error("Run npm run build before starting the preview."); });
  const port = Number(process.env.PORT || 3000);
  createPreviewServer().listen(port, "127.0.0.1", () => {
    console.log(`Floe preview: http://127.0.0.1:${port}`);
  });
}
