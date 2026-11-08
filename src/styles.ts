export const forkMapStyles = `
  :host { all: initial; color-scheme: dark; font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  * { box-sizing: border-box; }
  button { color: inherit; font: inherit; cursor: pointer; }
  .toggle { display: grid; place-items: center; width: 46px; height: 46px; border: 1px solid #44464b; border-radius: 50%; background: #222428; color: #f2f2f3; box-shadow: 0 4px 18px #0008; }
  .toggle:hover { background: #303238; }
  .toggle svg { width: 21px; height: 21px; }
  .panel { display: none; position: absolute; right: 0; bottom: 58px; width: min(360px, calc(100vw - 32px)); max-height: min(70vh, 560px); overflow: hidden; border: 1px solid #37393e; border-radius: 10px; background: #191a1d; color: #eee; box-shadow: 0 10px 38px #0009; }
  .panel.open { display: flex; flex-direction: column; }
  .resize-handle { position: absolute; z-index: 1; top: 0; bottom: 0; left: 0; width: 8px; cursor: ew-resize; touch-action: none; outline: none; }
  .resize-handle::before { position: absolute; top: 8px; bottom: 8px; left: 0; width: 2px; border-radius: 2px; background: transparent; content: ""; }
  .resize-handle:hover::before, .resize-handle:focus-visible::before { background: #7c9bc8; }
  .panel-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 15px; border-bottom: 1px solid #303136; }
  h2 { margin: 0; font-size: 14px; font-weight: 600; }
  .close { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: #aaa; font-size: 20px; }
  .close:hover { background: #2b2c31; color: #fff; }
  .filters { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #303136; }
  .filter-control { position: relative; min-width: 0; border: 1px solid #393b40; border-radius: 6px; background: #202125; color: #dedfe2; }
  .filter-control summary { padding: 6px 9px; cursor: pointer; list-style: none; white-space: nowrap; }
  .filter-control summary::-webkit-details-marker { display: none; }
  .filter-control summary::after { margin-left: 8px; color: #999ba2; content: "⌄"; }
  .project-options { position: absolute; z-index: 2; top: 100%; right: 0; left: auto; display: grid; gap: 2px; width: max-content; min-width: min(220px, calc(100vw - 64px)); max-width: min(320px, calc(100vw - 48px)); max-height: 220px; overflow: auto; margin-top: 4px; padding: 6px; border: 1px solid #393b40; border-radius: 6px; background: #202125; box-shadow: 0 8px 24px #0008; }
  .project-option, .recent-option { display: flex; align-items: center; gap: 8px; min-height: 30px; color: #dedfe2; }
  .project-option { padding: 4px 6px; border-radius: 4px; }
  .project-option span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .project-option:hover { background: #2b2c31; }
  .project-option input, .recent-option input { margin: 0; accent-color: #9ab9e8; }
  .recent-option { padding: 6px 9px; border: 1px solid #393b40; border-radius: 6px; white-space: nowrap; }
  .filter-empty { padding: 8px; color: #a5a6aa; }
  .tree-actions { display: flex; justify-content: flex-end; gap: 6px; padding: 8px 12px 0; }
  .tree-action { padding: 5px 8px; border: 1px solid #393b40; border-radius: 5px; background: transparent; color: #c5c6ca; font-size: 11px; }
  .tree-action:hover { background: #292a2f; color: #fff; }
  .tree { overflow: auto; padding: 10px 9px 14px; }
  .empty { margin: 6px; padding: 14px; color: #a5a6aa; }
  .group { margin-bottom: 12px; }
  .group-heading { display: flex; align-items: center; gap: 4px; margin: 8px 4px 4px; }
  .group-title { margin: 0 4px; color: #a5a7ad; font-size: 11px; font-weight: 600; }
  .disclosure { display: grid; flex: 0 0 24px; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 4px; background: transparent; color: #aaa; font-size: 13px; }
  .disclosure:hover { background: #292a2f; color: #fff; }
  .disclosure-spacer { flex: 0 0 24px; width: 24px; }
  .node { min-width: 0; }
  .node-row { display: flex; align-items: center; min-width: 0; }
  .node-link { display: flex; flex: 1; align-items: center; min-width: 0; min-height: 34px; padding: 6px 9px; overflow: hidden; border-radius: 6px; color: #dedfe2; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
  .node-link:hover { background: #292a2f; color: #fff; }
  .node-link.current { color: #b6d2ff; background: #242a33; }
  .children { margin-left: 12px; padding-left: 10px; border-left: 1px solid #41434a; }
  .placeholder { color: #a3a5ab; font-style: italic; }
  .badge { flex: 0 0 auto; margin-left: auto; padding-left: 8px; color: #8d9098; font-size: 11px; }
`;