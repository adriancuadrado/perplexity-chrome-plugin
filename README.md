# Perplexity Fork Map

A Manifest V3 Chrome extension that adds a small fork-map button to Perplexity. It reads conversation links visible in Projects and Recents, reads the parent link shown by Perplexity's “Continued from” indicator, and displays the fork trees in separate project-labeled groups. Choose one or more projects and optionally include conversations from Recents.

## Install for development

1. Open `chrome://extensions` and enable **Developer mode**.
2. Select **Load unpacked** and choose this folder.
3. Open or refresh a Perplexity conversation. Use the fork-map button in the lower-right corner.

The map and filter choices are stored locally in the extension and grow as conversations appear in Projects or Recents. Perplexity does not expose a complete conversation graph in the page, so conversations that have not been visible to the extension cannot be listed yet.