import {defineConfig} from 'vite';

// The checked-in HTML opens directly using a classic, bundled script.
// Vite replaces that entry with the TypeScript source for development/builds.
export default defineConfig({
  base:'./',
  plugins:[{
    name:'trainer-source-entry',
    transformIndexHtml:{
      order:'pre',
      handler(html){
        return html.replace(
          /<!--app-assets:start-->[\s\S]*?<!--app-assets:end-->/,
          '<script type="module" src="/src/main.tsx"></script>',
        );
      },
    },
  }],
});
