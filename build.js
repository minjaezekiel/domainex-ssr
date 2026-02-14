const fs = require('fs');
const path = require('path');

// --- Transpiler Setup ---
// For React JSX
const babel = require('@babel/core');
const reactPreset = require('@babel/preset-react');
const envPreset = require('@babel/preset-env');

// For Vue Single-File Components
const { compileTemplate } = require('@vue/compiler-sfc');

// Create dist directory if it doesn't exist
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true }); // Clean build
}
fs.mkdirSync(distPath);

// Process each component
const componentsDir = path.join(__dirname, 'components');
const componentFiles = fs.readdirSync(componentsDir);

console.log('Building components...');

componentFiles.forEach(file => {
  const filePath = path.join(componentsDir, file);
  const componentName = path.basename(file, path.extname(file));
  const ext = path.extname(file);
  let outputCode = '';

  try {
    if (ext === '.jsx') {
      // --- Process React JSX ---
      console.log(`Processing React component: ${file}`);
      const result = babel.transformFileSync(filePath, {
        presets: [envPreset, reactPreset],
        sourceMaps: false,
      });
      outputCode = result.code;

    } else if (ext === '.vue') {
      // --- Process Vue SFC ---
      console.log(`Processing Vue component: ${file}`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { descriptor } = require('@vue/compiler-sfc').parse(fileContent);
      
      // Extract script content
      const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || 'module.exports = {}';
      
      // Compile template to a render function
      const templateResult = compileTemplate({ source: descriptor.template.content });
      
      // Combine script and compiled template
      outputCode = `
        ${scriptContent.replace('export default', 'const componentOptions =')}
        componentOptions.render = ${templateResult.code};
        module.exports = componentOptions;
      `;

    } else if (ext === '.js') {
      // --- Process Vanilla JS ---
      console.log(`Processing Vanilla component: ${file}`);
      outputCode = fs.readFileSync(filePath, 'utf8');

    } else {
      console.warn(`Skipping unsupported file type: ${file}`);
      return;
    }

    // Write the processed component to the dist folder
    const outputPath = path.join(distPath, `${componentName}.js`);
    fs.writeFileSync(outputPath, outputCode);
    console.log(`Built ${file} -> ${componentName}.js`);

  } catch (error) {
    console.error(`Error building ${file}:`, error);
  }
});

console.log('\nBuild completed successfully!');