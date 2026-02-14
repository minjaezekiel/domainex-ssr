/**
 * DomainEx - Server-Side Rendering Engine
 * Simplifies SSR for frontend frameworks
 */
class DomainEx {
  constructor(options = {}) {
    this.options = {
      distPath: options.distPath || './dist',
      templatePath: options.templatePath || './template.html',
      cache: options.cache !== undefined ? options.cache : true,
      cacheMaxAge: options.cacheMaxAge || 1000 * 60 * 5, // 5 minutes
      framework: options.framework || 'auto', // auto, react, vue, vanilla
      ...options
    };
    
    this.cache = new Map();
    this.template = null;
    this.componentMap = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the DomainEx engine
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;
    
    // Load the template
    await this._loadTemplate();
    
    // Load components from dist folder
    await this._loadComponents();
    
    this.isInitialized = true;
  }

  /**
   * Render a component to HTML
   * @param {string} componentName - Name of the component to render
   * @param {object} props - Props to pass to the component
   * @param {object} options - Additional rendering options
   * @returns {Promise<string>} - Rendered HTML
   */
  async render(componentName, props = {}, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Check cache first
    const cacheKey = this._generateCacheKey(componentName, props);
    if (this.options.cache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.options.cacheMaxAge) {
        return cached.html;
      }
    }
    
    // Get the component
    const component = this.componentMap.get(componentName);
    if (!component) {
      throw new Error(`Component "${componentName}" not found`);
    }
    
    // Render the component based on framework
    let renderedContent;
    switch (this.options.framework) {
      case 'react':
        renderedContent = await this._renderReactComponent(component, props);
        break;
      case 'vue':
        renderedContent = await this._renderVueComponent(component, props);
        break;
      case 'vanilla':
        renderedContent = await this._renderVanillaComponent(component, props);
        break;
      case 'auto':
      default:
        renderedContent = await this._autoDetectAndRender(component, props);
        break;
    }
    
    // Inject into template
    const html = this._injectIntoTemplate(renderedContent, props, options);
    
    // Cache the result
    if (this.options.cache) {
      this.cache.set(cacheKey, {
        html,
        timestamp: Date.now()
      });
    }
    
    return html;
  }

  /**
   * Create an Express middleware for easy integration
   * @param {string} componentName - Default component to render
   * @param {function} propsExtractor - Function to extract props from request
   * @returns {function} Express middleware function
   */
  createMiddleware(componentName, propsExtractor = (req) => ({})) {
    return async (req, res, next) => {
      try {
        const props = typeof propsExtractor === 'function' 
          ? propsExtractor(req) 
          : propsExtractor;
        
        const html = await this.render(componentName, props);
        res.send(html);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Create a standalone server
   * @param {number} port - Port to listen on
   * @param {object} routes - Routes configuration
   * @returns {Promise<http.Server>} Node HTTP server
   */
  async createServer(port = 3000, routes = {}) {
    const http = require('http');
    
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${port}`);
        const route = routes[url.pathname] || {};
        
        if (route.component) {
          const props = typeof route.props === 'function' 
            ? route.props(req) 
            : route.props || {};
            
          const html = await this.render(route.component, props);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${error.message}`);
      }
    });
    
    return new Promise((resolve) => {
      server.listen(port, () => {
        console.log(`DomainEx server running on port ${port}`);
        resolve(server);
      });
    });
  }

  /**
   * Load the HTML template
   * @private
   */
  async _loadTemplate() {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const templatePath = path.resolve(this.options.templatePath);
      this.template = await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to load template: ${error.message}`);
    }
  }

  /**
   * Load components from the dist folder
   * @private
   */
  async _loadComponents() {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const distPath = path.resolve(this.options.distPath);
      const files = await fs.readdir(distPath);
      
      // Find the main JavaScript file
      const jsFiles = files.filter(file => 
        file.endsWith('.js') && !file.endsWith('.map')
      );
      
      if (jsFiles.length === 0) {
        throw new Error('No JavaScript files found in dist folder');
      }
      
      // Load each component
      for (const file of jsFiles) {
        const filePath = path.join(distPath, file);
        const componentCode = await fs.readFile(filePath, 'utf8');
        
        // Extract component name from file name
        const componentName = path.basename(file, '.js');
        
        // Store the component code for later evaluation
        this.componentMap.set(componentName, {
          code: componentCode,
          path: filePath
        });
      }
    } catch (error) {
      throw new Error(`Failed to load components: ${error.message}`);
    }
  }

  /**
   * Render a React component
   * @private
   */
  async _renderReactComponent(component, props) {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      runScripts: 'dangerously',
      pretendToBeVisual: true
    });
    
    // Set up global variables
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    
    // Load React
    const React = require('react');
    const ReactDOMServer = require('react-dom/server');
    
    // Evaluate the component code
    const module = { exports: {} };
    eval(component.code);
    const Component = module.exports;
    
    // Render the component
    const element = React.createElement(Component, props);
    return ReactDOMServer.renderToString(element);
  }

  /**
   * Render a Vue component
   * @private
   */
  async _renderVueComponent(component, props) {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      runScripts: 'dangerously',
      pretendToBeVisual: true
    });
    
    // Set up global variables
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    
    // Load Vue
    const Vue = require('vue');
    
    // Evaluate the component code
    const module = { exports: {} };
    eval(component.code);
    const Component = module.exports;
    
    // Create a Vue instance and render it
    const app = Vue.createApp(Component, props);
    const renderer = require('@vue/server-renderer').createSSRApp(app);
    return await renderer.renderToString();
  }

  /**
   * Render a vanilla JS component
   * @private
   */
  async _renderVanillaComponent(component, props) {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      runScripts: 'dangerously',
      pretendToBeVisual: true
    });
    
    // Set up global variables
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    
    // Evaluate the component code
    const module = { exports: {} };
    eval(component.code);
    const renderFunction = module.exports;
    
    // Execute the render function
    if (typeof renderFunction === 'function') {
      return renderFunction(props);
    } else {
      throw new Error('Vanilla component must export a render function');
    }
  }

  /**
   * Auto-detect framework and render component
   * @private
   */
  async _autoDetectAndRender(component, props) {
    // Try to detect the framework based on imports/exports
    if (component.code.includes('React') || component.code.includes('jsx')) {
      this.options.framework = 'react';
      return this._renderReactComponent(component, props);
    } else if (component.code.includes('Vue') || component.code.includes('vue')) {
      this.options.framework = 'vue';
      return this._renderVueComponent(component, props);
    } else {
      this.options.framework = 'vanilla';
      return this._renderVanillaComponent(component, props);
    }
  }

  /**
   * Inject rendered content into the template
   * @private
   */
  _injectIntoTemplate(content, props, options) {
    let html = this.template;
    
    // Replace content placeholder
    html = html.replace('{{content}}', content);
    
    // Inject props as a script if needed
    if (options.injectProps !== false) {
      const propsScript = `<script>window.__PROPS__ = ${JSON.stringify(props)};</script>`;
      html = html.replace('</head>', `${propsScript}</head>`);
    }
    
    // Replace other placeholders
    if (options.title) {
      html = html.replace('{{title}}', options.title);
    }
    
    if (options.meta && typeof options.meta === 'object') {
      for (const [name, content] of Object.entries(options.meta)) {
        const metaTag = `<meta name="${name}" content="${content}">`;
        html = html.replace('</head>', `${metaTag}</head>`);
      }
    }
    
    return html;
  }

  _generateCacheKey(componentName, props) {
    return `${componentName}:${JSON.stringify(props)}`;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = DomainEx;