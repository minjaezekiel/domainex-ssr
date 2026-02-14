"use strict";

const path = require("path");
const express = require("express");

const DomainEx = require("./domainex");

function getQueryParams(reqUrl) {
  const url = new URL(reqUrl, "http://localhost");
  return Object.fromEntries(url.searchParams.entries());
}

async function startExpress() {
  const app = express();

  const dx = new DomainEx({
    distPath: path.join(__dirname, "dist"),
    templatePath: path.join(__dirname, "template.html"),
    cache: true,
    cacheMaxAge: 1000 * 20,
    dev: true,
    logger: console,
  });

  // Optional: serve built assets (if you later add hydration)
  // app.use("/assets", express.static(path.join(__dirname, "dist/assets")));

  app.get("/", (req, res) => res.redirect("/react"));

  app.get(
    "/react",
    dx.createMiddleware(
      "App",
      (req) => {
        const q = req.query || {};
        return {
          title: "React SSR",
          user: q.user || "Guest",
          description: "React rendered using DomainEx",
        };
      },
      () => ({
        meta: {
          engine: "DomainEx",
          framework: "React",
        },
      })
    )
  );

  app.get(
    "/vue",
    dx.createMiddleware("Landing", (req) => {
      const q = req.query || {};
      return {
        title: "Vue SSR",
        user: q.user || "Guest",
        description: "Vue rendered using DomainEx",
      };
    })
  );

  app.get(
    "/vanilla",
    dx.createMiddleware("Home", (req) => {
      const q = req.query || {};
      return {
        title: "Vanilla SSR",
        user: q.user || "Guest",
        description: "Vanilla rendered using DomainEx",
      };
    })
  );

  app.use((err, req, res, next) => {
    res.status(500).send(`<pre>${err.stack || err.message}</pre>`);
  });

  const port = 3000;
  app.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`);
  });
}

async function startStandalone() {
  const dx = new DomainEx({
    distPath: path.join(__dirname, "dist"),
    templatePath: path.join(__dirname, "template.html"),
    cache: true,
    cacheMaxAge: 1000 * 20,
    dev: true,
    logger: console,
  });

  const port = 3000;

  await dx.createServer(
    port,
    {
      "/": {
        component: "App",
        props: () => ({
          title: "React SSR (Standalone)",
          user: "Guest",
        }),
      },

      "/react": {
        component: "App",
        props: (req) => {
          const q = getQueryParams(req.url);
          return {
            title: "React SSR (Standalone)",
            user: q.user || "Guest",
          };
        },
      },

      "/vue": {
        component: "Landing",
        props: (req) => {
          const q = getQueryParams(req.url);
          return {
            title: "Vue SSR (Standalone)",
            user: q.user || "Guest",
          };
        },
      },

      "/vanilla": {
        component: "Home",
        props: (req) => {
          const q = getQueryParams(req.url);
          return {
            title: "Vanilla SSR (Standalone)",
            user: q.user || "Guest",
          };
        },
      },
    },
    {
      // Optional: serve dist assets
      // staticDir: path.join(__dirname, "dist/assets"),
      // staticUrlPrefix: "/assets",
    }
  );
}

// Choose mode from CLI
// node server.js express
// node server.js standalone
const mode = process.argv[2] || "express";

if (mode === "standalone") {
  startStandalone().catch(console.error);
} else {
  startExpress().catch(console.error);
}
