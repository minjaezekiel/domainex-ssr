"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");

class DomainEx {
  constructor(options = {}) {
    this.options = {
      distPath: options.distPath || path.join(process.cwd(), "dist"),
      templatePath: options.templatePath || path.join(process.cwd(), "template.html"),

      cache: options.cache ?? true,
      cacheMaxAge: options.cacheMaxAge ?? 1000 * 60 * 5,

      dev: options.dev ?? false,
      logger: options.logger ?? console,

      // If true, reload dist files on every request (dev convenience)
      hotReload: options.hotReload ?? (options.dev ?? false),

      ...options,
    };

    this.template = null;
    this.isInitialized = false;

    this.cache = new Map(); // key -> { html, ts }
    this.componentMap = new Map(); // name -> { module, framework }
  }

  // ---------------------------
  // Public API
  // ---------------------------

  async initialize() {
    if (this.isInitialized) return;

    await this._loadTemplate();
    await this._loadComponents();

    this.isInitialized = true;
    this.options.logger?.log?.("[DomainEx] Initialized.");
  }

  async render(componentName, props = {}) {
    if (!this.isInitialized) await this.initialize();

    if (this.options.hotReload) {
      // In dev mode we reload components each request
      await this._loadComponents();
    }

    const cacheKey = this._cacheKey(componentName, props);

    if (this.options.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.ts < this.options.cacheMaxAge) {
        return cached.html;
      }
    }

    const entry = this.componentMap.get(componentName);
    if (!entry) {
      throw new Error(
        `[DomainEx] Component "${componentName}" not found in dist folder.`
      );
    }

    const { module: loaded, framework } = entry;

    let content = "";

    if (framework === "react") {
      content = await this._renderReact(loaded, props);
    } else if (framework === "vue") {
      content = await this._renderVue(loaded, props);
    } else {
      content = await this._renderVanilla(loaded, props);
    }

    const html = this._applyTemplate(content, props);

    if (this.options.cache) {
      this.cache.set(cacheKey, { html, ts: Date.now() });
    }

    return html;
  }

  createMiddleware(componentName, propsExtractor = (req) => ({})) {
    return async (req, res, next) => {
      try {
        const props = await propsExtractor(req);

        const html = await this.render(componentName, props);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);
      } catch (err) {
        this.options.logger?.error?.(err);
        next(err);
      }
    };
  }

  /**
   * Standalone HTTP server (no express)
   *
   * routes:
   *  {
   *    "/react": { component: "App", props: (req)=>({}) }
   *  }
   */
  async createServer(port, routes = {}, opts = {}) {
    if (!this.isInitialized) await this.initialize();

    const server = http.createServer(async (req, res) => {
      try {
        const pathname = new URL(req.url, "http://localhost").pathname;

        const route = routes[pathname];
        if (!route) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("404 Not Found");
          return;
        }

        const props =
          typeof route.props === "function" ? await route.props(req) : route.props || {};

        const html = await this.render(route.component, props);

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(html);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(this._errorPage(err));
      }
    });

    return new Promise((resolve) => {
      server.listen(port, () => {
        this.options.logger?.log?.(
          `[DomainEx] Standalone server running on http://localhost:${port}`
        );
        resolve(server);
      });
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // ---------------------------
  // Internal
  // ---------------------------

  async _loadTemplate() {
    const p = this.options.templatePath;
    this.template = await fs.promises.readFile(p, "utf8");
  }

  async _loadComponents() {
    const distPath = this.options.distPath;

    if (!fs.existsSync(distPath)) {
      throw new Error(`[DomainEx] distPath does not exist: ${distPath}`);
    }

    const files = await fs.promises.readdir(distPath);
    const jsFiles = files.filter((f) => f.endsWith(".js"));

    const nextMap = new Map();

    for (const file of jsFiles) {
      const filePath = path.join(distPath, file);
      const name = path.basename(file, ".js");

      // Hot reload: clear require cache
      delete require.cache[require.resolve(filePath)];

      const mod = require(filePath);

      // Detect framework using exported shape (more reliable than scanning source)
      const framework = this._detectFramework(mod);

      nextMap.set(name, { module: mod, framework });
    }

    this.componentMap = nextMap;
  }

  _detectFramework(mod) {
    // React: function component OR object with $$typeof? (rare)
    // Vue: object with render function (from SFC build)
    // Vanilla: function that returns string

    // Vue SFC compiled output is usually an object
    if (mod && typeof mod === "object" && typeof mod.render === "function") {
      return "vue";
    }

    // React components usually are functions
    // But Vanilla also is function. So we decide:
    // - React: function that returns React element
    // - Vanilla: function that returns string
    //
    // We can't know without calling it. So we classify functions as "react"
    // only if React is installed AND the function name starts with capital letter.
    if (typeof mod === "function") {
      const looksLikeReact =
        /^[A-Z]/.test(mod.name || "") || /^[A-Z]/.test(mod.displayName || "");

      if (looksLikeReact) return "react";
      return "vanilla";
    }

    // React build output might export { default: fn }
    if (mod && typeof mod === "object" && typeof mod.default === "function") {
      const fn = mod.default;
      const looksLikeReact =
        /^[A-Z]/.test(fn.name || "") || /^[A-Z]/.test(fn.displayName || "");
      return looksLikeReact ? "react" : "vanilla";
    }

    return "vanilla";
  }

  async _renderReact(mod, props) {
    const React = require("react");
    const ReactDOMServer = require("react-dom/server");

    const Component = this._unwrapDefault(mod);

    const element = React.createElement(Component, props);
    return ReactDOMServer.renderToString(element);
  }

  async _renderVue(mod, props) {
    const { createSSRApp, h } = require("vue");
    const { renderToString } = require("@vue/server-renderer");

    const component = this._unwrapDefault(mod);

    // Correct SSR usage: createSSRApp({ render: () => h(Component, props) })
    const app = createSSRApp({
      render: () => h(component, props),
    });

    return await renderToString(app);
  }

  async _renderVanilla(mod, props) {
    const fn = this._unwrapDefault(mod);

    if (typeof fn !== "function") {
      throw new Error("[DomainEx] Vanilla component must export a function.");
    }

    const html = await fn(props);

    if (typeof html !== "string") {
      throw new Error(
        "[DomainEx] Vanilla component must return a string of HTML."
      );
    }

    return html;
  }

  _unwrapDefault(mod) {
    if (mod && typeof mod === "object" && mod.default) return mod.default;
    return mod;
  }

  _applyTemplate(content, props) {
    let html = this.template;

    html = html.replace("{{content}}", content);

    // Title/description
    html = html.replace(/{{title}}/g, this._escapeHtml(props.title || "DomainEx SSR"));
    html = html.replace(
      /{{description}}/g,
      this._escapeHtml(props.description || "Server-side rendered with DomainEx")
    );

    // Inject props for client usage
    const safeProps = JSON.stringify(props).replace(/</g, "\\u003c");
    const propsScript = `<script>window.__DOMAINEX_PROPS__=${safeProps};</script>`;

    html = html.replace("</head>", `${propsScript}\n</head>`);

    return html;
  }

  _cacheKey(componentName, props) {
    // Stable cache key (hash)
    const raw = `${componentName}|${this._stableStringify(props)}`;
    return crypto.createHash("sha1").update(raw).digest("hex");
  }

  _stableStringify(obj) {
    if (!obj || typeof obj !== "object") return JSON.stringify(obj);

    const keys = Object.keys(obj).sort();
    const out = {};
    for (const k of keys) out[k] = obj[k];
    return JSON.stringify(out);
  }

  _escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _errorPage(err) {
    const msg = this._escapeHtml(err?.stack || err?.message || String(err));
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>DomainEx Error</title>
          <style>
            body { background:#0b0f17; color:#e7eefc; font-family: system-ui; padding: 18px; }
            pre { background: rgba(255,255,255,0.06); padding: 14px; border-radius: 12px; overflow:auto; }
          </style>
        </head>
        <body>
          <h1>SSR Error</h1>
          <pre>${msg}</pre>
        </body>
      </html>
    `;
  }
}

module.exports = DomainEx;
