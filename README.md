# Perplexity Fork Map

A Manifest V3 Chrome extension that adds a small fork-map button to Perplexity. It reads conversation links visible in Projects and Recents, reads the parent link shown by Perplexity's “Continued from” indicator, and displays the fork trees in separate project-labeled groups. Choose one or more projects and optionally include conversations from Recents.

## Build and install

1. Run `npm install`.
2. Run `npm run build` to generate the loadable extension in `dist/`.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Select **Load unpacked** and choose this folder's `dist/` directory.
5. Open or refresh Perplexity. Use the fork-map button in the lower-right corner.

The map and filter choices are stored locally in the extension and grow as conversations appear in Projects or Recents. Perplexity does not expose a complete conversation graph in the page, so conversations that have not been visible to the extension cannot be listed yet.