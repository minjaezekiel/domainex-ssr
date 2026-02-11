
# DomainEx - Server-Side Rendering Engine

[![npm version](https://badge.fury.io/js/domainex.svg)](https://badge.fury.io/js/domainex)
[![Build Status](https://travis-ci.org/username/domainex.svg?branch=main)](https://travis-ci.org/username/domainex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

DomainEx (Domain Expansion) is a powerful, framework-agnostic server-side rendering (SSR) engine that simplifies the process of rendering frontend applications on the server. It abstracts away the complexity of SSR while providing a clean, intuitive API for developers.

## Features

- **Framework Agnostic**: Works with React, Vue, and vanilla JavaScript components
- **Auto-Detection**: Automatically detects the framework used in your components
- **Built-in Caching**: Intelligent caching system to improve performance
- **Easy Integration**: Simple API and Express middleware for quick setup
- **Standalone Server**: Create a complete server with just a few lines of code
- **Template System**: Flexible template system with support for dynamic content

## Installation

```bash
npm install domainex
```

## Quick Start

### Basic Setup

```javascript
const express = require('express');
const DomainEx = require('domainex');

// Initialize DomainEx
const ssr = new DomainEx({
  distPath: './dist',           // Path to your built frontend files
  templatePath: './template.html', // HTML template file
  framework: 'auto',            // Auto-detect framework
  cache: true                   // Enable caching
});

// Create Express app
const app = express();

// Create middleware for the Home component
app.use('/', ssr.createMiddleware('Home', (req) => ({
  path: req.path,
  query: req.query
})));

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Template HTML Example

Create a `template.html` file with placeholders:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title || DomainEx SSR}}</title>
  <meta name="description" content="{{description || Server-side rendered with DomainEx}}">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="app">
    {{content}}
  </div>
  <script>
    // Client-side hydration
    if (typeof window !== 'undefined' && window.__PROPS__) {
      // Use props for client-side initialization
      console.log('Props from server:', window.__PROPS__);
    }
  </script>
</body>
</html>
```

## Production Deployment with Express.js

For production environments, it's recommended to use a more robust setup:

```javascript
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const DomainEx = require('domainex');

// Initialize Express app
const app = express();

// Apply security and performance middleware
app.use(helmet());
app.use(compression());
app.use(express.static('public')); // Serve static assets

// Initialize DomainEx with production settings
const ssr = new DomainEx({
  distPath: './dist',
  templatePath: './template.html',
  framework: 'auto',
  cache: true,
  cacheMaxAge: 1000 * 60 * 10, // 10 minutes cache
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Create routes
app.get('/', ssr.createMiddleware('Home', (req) => ({
  path: req.path,
  query: req.query
})));

app.get('/about', ssr.createMiddleware('About', {
  title: 'About Us',
  content: 'Learn more about our company'
}));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
```

### Docker Deployment

For containerized deployments, consider this Dockerfile:

```dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Build your frontend application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
```

## Potential Challenges and Limitations

### Current Implementation Challenges

1. **Memory Usage**: The current implementation loads all components into memory during initialization, which can lead to high memory usage for large applications.

2. **Hot Reloading**: There's no built-in support for hot reloading in development environments, which can slow down the development workflow.

3. **Error Handling**: While basic error handling is implemented, more granular error reporting and recovery mechanisms would improve the developer experience.

4. **Bundle Size Optimization**: The current implementation doesn't optimize bundle sizes or implement code splitting, which can impact performance.

5. **State Management**: Complex state management scenarios (e.g., Redux, Vuex) are not fully supported out of the box.

6. **CSS-in-JS Support**: While basic CSS is supported, advanced CSS-in-JS solutions may require additional configuration.

### Security Considerations

1. **XSS Protection**: While the template system helps prevent XSS attacks, developers should still sanitize user input.

2. **Memory Leaks**: Long-running processes with caching enabled could potentially develop memory leaks if not monitored.

3. **Resource Limits**: In high-traffic scenarios, the server might hit resource limits without proper scaling strategies.

## Future Improvements

We're planning to enhance DomainEx with these features:

1. **Streaming Support**: Implement streaming SSR to improve time-to-first-byte (TTFB) metrics.

2. **Code Splitting**: Add automatic code splitting and lazy loading for better performance.

3. **Advanced Caching**: Implement multi-level caching with Redis or Memcached support.

4. **State Management Integration**: First-class support for popular state management libraries.

5. **CSS-in-JS Support**: Native support for popular CSS-in-JS libraries.

6. **Performance Monitoring**: Built-in performance monitoring and metrics collection.

7. **CLI Tool**: A command-line interface for scaffolding and managing DomainEx projects.

8. **TypeScript Support**: Full TypeScript support with type definitions.

9. **GraphQL Integration**: Native support for GraphQL data fetching during SSR.

10. **Progressive Enhancement**: Better support for progressive enhancement strategies.

## How to Contribute

We welcome contributions from the community! Here's how you can help:

### Reporting Issues

If you find a bug or have a feature request, please:

1. Check existing issues to avoid duplicates
2. Use the provided issue templates
3. Provide as much detail as possible, including:
   - Steps to reproduce
   - Expected vs. actual behavior
   - Environment details (Node.js version, OS, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Start development mode: `npm run dev`

### Code Style

- Follow the existing code style
- Use ESLint for linting: `npm run lint`
- Write clear, concise commit messages
- Document new features with appropriate comments

### Areas Where We Need Help

1. **Framework Adapters**: Help us create adapters for more frontend frameworks (Angular, Svelte, etc.)
2. **Performance Optimization**: Contribute to improving the rendering performance
3. **Documentation**: Help improve documentation, add examples, and create tutorials
4. **Testing**: Increase test coverage, especially for edge cases
5. **CLI Tool**: Help develop the command-line interface tool

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all the contributors who have helped make DomainEx better
- Inspired by the need for simpler SSR solutions in the JavaScript ecosystem
