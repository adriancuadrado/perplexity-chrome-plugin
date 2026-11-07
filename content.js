(() => {
  const storageKey = 'perplexityForkMap';
  const projectStorageKey = 'perplexityForkMapProjects';
  const filterStorageKey = 'perplexityForkMapFilters';
  const conversationPath = /\/(search|thread|conversation|session)\//i;
  const pageKey = () => new URL(location.href).origin + location.pathname;

  if (window.__perplexityForkMapLoaded) return;
  window.__perplexityForkMapLoaded = true;

  const host = document.createElement('div');
  host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; right: 20px; bottom: 20px;';
  document.documentElement.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
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
      header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 15px; border-bottom: 1px solid #303136; }
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
      .node-link { display: flex; align-items: center; min-height: 34px; padding: 6px 9px; overflow: hidden; border-radius: 6px; color: #dedfe2; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
      .node-link:hover { background: #292a2f; color: #fff; }
      .node-link.current { color: #b6d2ff; background: #242a33; }
      .children { margin-left: 12px; padding-left: 10px; border-left: 1px solid #41434a; }
      .placeholder { color: #a3a5ab; font-style: italic; }
      .badge { flex: 0 0 auto; margin-left: auto; padding-left: 8px; color: #8d9098; font-size: 11px; }
    </style>
    <section class="panel" aria-label="Conversation fork map">
      <div class="resize-handle" role="separator" aria-label="Resize conversation fork map" aria-orientation="vertical" aria-valuemin="260" aria-valuemax="360" tabindex="0"></div>
      <header><h2>Conversation forks</h2><button class="close" aria-label="Close fork map" title="Close">&times;</button></header>
      <div class="filters">
        <label class="recent-option"><input class="include-recents" type="checkbox"><span>Include Recents</span></label>
        <details class="filter-control project-filter"><summary>Projects</summary><div class="project-options"></div></details>
      </div>
      <div class="tree-actions" role="toolbar" aria-label="Conversation tree controls">
        <button class="tree-action collapse-all" type="button">Collapse all</button>
        <button class="tree-action expand-all" type="button">Expand all</button>
      </div>
      <div class="tree" role="tree"></div>
    </section>
    <button class="toggle" aria-label="Open conversation fork map" title="Conversation forks">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v5a4 4 0 0 0 4 4h6"/><path d="m14 9 3 4-3 4"/><path d="M7 20v-3"/></svg>
    </button>`;

  const panel = shadow.querySelector('.panel');
  const tree = shadow.querySelector('.tree');
  const resizeHandle = shadow.querySelector('.resize-handle');
  const includeRecentsInput = shadow.querySelector('.include-recents');
  const projectFilter = shadow.querySelector('.project-filter');
  const projectOptions = shadow.querySelector('.project-options');
  const collapsedGroups = new Set();
  const collapsedNodes = new Set();
  let renderedGroupIds = new Set();
  let renderedNodeIds = new Set();
  let resizeStart;
  let filterSettings;

  function resizePanel(width) {
    const maxWidth = Math.max(160, window.innerWidth - 32);
    const minWidth = Math.min(260, maxWidth);
    const boundedWidth = Math.min(Math.max(width, minWidth), maxWidth);
    panel.style.width = `${boundedWidth}px`;
    resizeHandle.setAttribute('aria-valuemin', String(minWidth));
    resizeHandle.setAttribute('aria-valuemax', String(maxWidth));
    resizeHandle.setAttribute('aria-valuenow', String(Math.round(boundedWidth)));
    fitProjectOptions();
  }

  function fitProjectOptions() {
    const maxWidth = Math.max(140, panel.clientWidth - 24);
    projectOptions.style.minWidth = `${Math.min(220, maxWidth)}px`;
    projectOptions.style.maxWidth = `${maxWidth}px`;
  }

  async function persistPanelWidth() {
    const settings = await loadFilterSettings();
    settings.panelWidth = panel.getBoundingClientRect().width;
    await saveFilterSettings(settings);
  }

  resizeHandle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    resizeStart = { pointerId: event.pointerId, clientX: event.clientX, width: panel.getBoundingClientRect().width };
    resizeHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  resizeHandle.addEventListener('pointermove', (event) => {
    if (!resizeStart || event.pointerId !== resizeStart.pointerId) return;
    resizePanel(resizeStart.width + resizeStart.clientX - event.clientX);
  });
  const endResize = (event) => {
    if (resizeStart?.pointerId === event.pointerId) {
      resizeStart = null;
      persistPanelWidth();
    }
  };
  resizeHandle.addEventListener('pointerup', endResize);
  resizeHandle.addEventListener('pointercancel', endResize);
  resizeHandle.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    resizePanel(panel.getBoundingClientRect().width + (event.key === 'ArrowLeft' ? 16 : -16));
    persistPanelWidth();
    event.preventDefault();
  });
  shadow.querySelector('.collapse-all').addEventListener('click', () => {
    for (const groupId of renderedGroupIds) collapsedGroups.add(groupId);
    for (const nodeId of renderedNodeIds) collapsedNodes.add(nodeId);
    render();
  });
  shadow.querySelector('.expand-all').addEventListener('click', () => {
    collapsedGroups.clear();
    collapsedNodes.clear();
    render();
  });
  includeRecentsInput.addEventListener('change', async () => {
    const settings = await loadFilterSettings();
    settings.includeRecents = includeRecentsInput.checked;
    await saveFilterSettings(settings);
    render();
  });
  shadow.querySelector('.toggle').addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) render();
  });
  shadow.querySelector('.close').addEventListener('click', () => panel.classList.remove('open'));

  function isConversationUrl(href) {
    try {
      const url = new URL(href, location.origin);
      return url.origin === location.origin && conversationPath.test(url.pathname);
    } catch {
      return false;
    }
  }

  function canonicalUrl(href) {
    const url = new URL(href, location.origin);
    return url.origin + url.pathname;
  }

  function titleFromUrl(href) {
    const url = new URL(href, location.origin);
    const slug = url.pathname.split('/').filter(Boolean).pop() || 'Conversation';
    return decodeURIComponent(slug).replace(/-[0-9a-f]{8}(-[0-9a-f-]{20,})?$/i, '').replace(/-/g, ' ');
  }

  function conversationTitle(href, anchor) {
    const anchorTitle = anchor?.innerText.trim().replace(/^Continued from\s*/i, '').trim();
    if (anchorTitle) return anchorTitle;
    const anchorAriaLabel = anchor?.getAttribute('aria-label')?.trim().replace(/^Continued from\s*/i, '').trim();
    if (anchorAriaLabel) return anchorAriaLabel;
    const heading = document.querySelector('main h1')?.innerText.trim();
    if (canonicalUrl(href) === pageKey() && heading && !/what do you want to know|what should we work on/i.test(heading)) return heading;
    const documentTitle = document.title.replace(/\s*[|–-]\s*Perplexity\s*$/i, '').trim();
    if (canonicalUrl(href) === pageKey() && documentTitle && documentTitle !== 'Perplexity') return documentTitle;
    return titleFromUrl(href);
  }

  function parentConversation() {
    const labels = [...document.querySelectorAll('body *')].filter((element) => {
      return element.children.length === 0 && element.textContent.trim() === 'Continued from';
    });
    for (const label of labels) {
      let ancestor = label.parentElement;
      for (let depth = 0; ancestor && depth < 5; depth += 1, ancestor = ancestor.parentElement) {
        const link = [...ancestor.querySelectorAll('a[href]')].find((candidate) => {
          return isConversationUrl(candidate.href) && canonicalUrl(candidate.href) !== pageKey();
        });
        if (link) {
          const title = link.innerText.trim().replace(/^Continued from\s*/i, '').trim();
          return { url: canonicalUrl(link.href), title: title || titleFromUrl(link.href) };
        }
      }
    }
    return null;
  }

  function visibleConversations() {
    return [...document.querySelectorAll('a[href]')]
      .filter((anchor) => isConversationUrl(anchor.href))
      .map((anchor) => ({ url: canonicalUrl(anchor.href), title: conversationTitle(anchor.href, anchor) }));
  }

  function sectionItems(label, sectionPath, followingPath) {
    const textNode = [...document.querySelectorAll('body *')].find((element) => {
      return element.children.length === 0 && element.textContent.trim() === label;
    });
    if (!textNode) return [];

    let headerRow = textNode;
    for (let depth = 0; headerRow && depth < 6; depth += 1, headerRow = headerRow.parentElement) {
      const hasSectionLink = [...headerRow.querySelectorAll('a[href]')].some((anchor) => {
        return new URL(anchor.href, location.origin).pathname === sectionPath;
      });
      if (hasSectionLink) break;
    }
    const sectionContainer = headerRow?.parentElement;
    if (!sectionContainer) return [];

    const siblings = [...sectionContainer.children];
    const start = siblings.indexOf(headerRow) + 1;
    let end = siblings.length;
    if (followingPath) {
      const nextSection = siblings.findIndex((sibling, index) => {
        return index >= start && [...sibling.querySelectorAll('a[href]')].some((anchor) => {
          return new URL(anchor.href, location.origin).pathname === followingPath;
        });
      });
      if (nextSection >= 0) end = nextSection;
    }
    return siblings.slice(start, end);
  }

  function anchorLabel(anchor) {
    return anchor.innerText.trim().replace(/^Continued from\s*/i, '').trim()
      || anchor.getAttribute('aria-label')?.trim().replace(/^Continued from\s*/i, '').trim()
      || anchor.title.trim();
  }

  function projectForConversation(anchor, boundary) {
    for (let ancestor = anchor.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const projectLink = [...ancestor.querySelectorAll('a[href]')].find((candidate) => {
        if (candidate === anchor || isConversationUrl(candidate.href)) return false;
        const path = new URL(candidate.href, location.origin).pathname;
        return path !== '/projects' && path !== '/library' && Boolean(anchorLabel(candidate));
      });
      if (projectLink) {
        const title = anchorLabel(projectLink);
        return { id: canonicalUrl(projectLink.href), title };
      }
      if (ancestor === boundary) break;
    }
    return null;
  }

  function sidebarConversations() {
    const projects = {};
    const projectItems = sectionItems('Projects', '/projects', '/library');
    for (const projectItem of projectItems) {
      const links = [...projectItem.querySelectorAll('a[href]')].filter((anchor) => isConversationUrl(anchor.href));
      for (const anchor of links) {
        const project = projectForConversation(anchor, projectItem);
        if (!project) continue;
        const item = { url: canonicalUrl(anchor.href), title: conversationTitle(anchor.href, anchor) };
        projects[project.id] ||= { ...project, conversations: [] };
        if (!projects[project.id].conversations.some((conversation) => conversation.url === item.url)) {
          projects[project.id].conversations.push(item);
        }
      }
    }

    const recentItems = sectionItems('Recents', '/library');
    const recents = recentItems.flatMap((item) => [...item.querySelectorAll('a[href]')]
      .filter((anchor) => isConversationUrl(anchor.href))
      .map((anchor) => ({ url: canonicalUrl(anchor.href), title: conversationTitle(anchor.href, anchor) })));
    return { projects, recents };
  }

  function loadRecords() {
    return new Promise((resolve) => chrome.storage.local.get([storageKey], (result) => resolve(result[storageKey] || {})));
  }

  function loadProjects() {
    return new Promise((resolve) => chrome.storage.local.get([projectStorageKey], (result) => resolve(result[projectStorageKey] || {})));
  }

  function loadFilterSettings() {
    if (!filterSettings) {
      filterSettings = new Promise((resolve) => {
        chrome.storage.local.get([filterStorageKey], (result) => {
          resolve({ includeRecents: true, selectedProjectIds: null, ...(result[filterStorageKey] || {}) });
        });
      });
    }
    return filterSettings;
  }

  function saveRecords(records) {
    return new Promise((resolve) => chrome.storage.local.set({ [storageKey]: records }, resolve));
  }

  function saveProjects(projects) {
    return new Promise((resolve) => chrome.storage.local.set({ [projectStorageKey]: projects }, resolve));
  }

  function saveFilterSettings(settings) {
    filterSettings = Promise.resolve(settings);
    return new Promise((resolve) => chrome.storage.local.set({ [filterStorageKey]: settings }, resolve));
  }

  async function scan() {
    const [records, projects] = await Promise.all([loadRecords(), loadProjects()]);
    const timestamp = Date.now();
    for (const item of visibleConversations()) {
      const existing = records[item.url] || {};
      records[item.url] = { ...existing, ...item, lastSeen: timestamp };
    }

    const sidebar = sidebarConversations();
    for (const project of Object.values(sidebar.projects)) {
      projects[project.id] = { id: project.id, title: project.title };
      for (const item of project.conversations) {
        const record = records[item.url] || { url: item.url, title: item.title };
        record.title = item.title || record.title;
        record.projectIds = [...new Set([...(record.projectIds || []), project.id])];
        record.lastSeen = timestamp;
        records[item.url] = record;
      }
    }
    for (const item of sidebar.recents) {
      const record = records[item.url] || { url: item.url, title: item.title };
      record.title = item.title || record.title;
      record.inRecents = true;
      record.lastSeen = timestamp;
      records[item.url] = record;
    }

    if (conversationPath.test(location.pathname)) {
      const parent = parentConversation();
      const currentAnchor = [...document.querySelectorAll('a[href]')].find((anchor) => {
        return isConversationUrl(anchor.href) && canonicalUrl(anchor.href) === pageKey();
      });
      const title = conversationTitle(location.href, currentAnchor);
      const currentUrl = pageKey();
      const current = records[currentUrl] || {};
      records[currentUrl] = {
        ...current,
        url: currentUrl,
        title,
        parentUrl: parent?.url || current.parentUrl || '',
        parentTitle: parent?.title || current.parentTitle || '',
        lastSeen: timestamp
      };
      if (parent && !records[parent.url]) {
        records[parent.url] = { url: parent.url, title: parent.title, lastSeen: timestamp - 1 };
      }
    }

    await Promise.all([saveRecords(records), saveProjects(projects)]);
    if (panel.classList.contains('open')) render(records, projects);
  }

  function renderNode(record, ancestry, groupRecords) {
    const wrapper = document.createElement('div');
    wrapper.className = 'node';
    wrapper.setAttribute('role', 'treeitem');
    const anchor = document.createElement('a');
    anchor.className = 'node-link' + (record.url === pageKey() ? ' current' : '') + (record.placeholder ? ' placeholder' : '');
    anchor.textContent = record.title || 'Untitled conversation';
    anchor.title = record.title || 'Untitled conversation';
    if (record.url) anchor.href = record.url;
    else anchor.removeAttribute('href');
    if (record.url === pageKey()) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Current';
      anchor.append(badge);
    }
    wrapper.append(anchor);

    const nextAncestry = new Set(ancestry);
    nextAncestry.add(record.url || `placeholder:${record.title}`);
    const children = Object.values(groupRecords)
      .filter((child) => child.parentUrl === record.url && !nextAncestry.has(child.url))
      .sort((left, right) => (right.lastSeen || 0) - (left.lastSeen || 0));
    const isCollapsed = collapsedNodes.has(record.url);
    if (children.length) renderedNodeIds.add(record.url);

    const row = document.createElement('div');
    row.className = 'node-row';
    if (children.length) {
      const disclosure = document.createElement('button');
      disclosure.className = 'disclosure node-disclosure';
      disclosure.type = 'button';
      disclosure.setAttribute('aria-expanded', String(!isCollapsed));
      disclosure.setAttribute('aria-label', `${isCollapsed ? 'Expand' : 'Collapse'} ${record.title || 'conversation'}`);
      disclosure.title = `${isCollapsed ? 'Expand' : 'Collapse'} conversation`;
      disclosure.textContent = isCollapsed ? '\u25b8' : '\u25be';
      disclosure.addEventListener('click', () => {
        if (collapsedNodes.has(record.url)) collapsedNodes.delete(record.url);
        else collapsedNodes.add(record.url);
        render();
      });
      row.append(disclosure);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'disclosure-spacer';
      row.append(spacer);
    }
    row.append(anchor);
    wrapper.replaceChildren(row);

    if (children.length) {
      const group = document.createElement('div');
      group.className = 'children';
      group.setAttribute('role', 'group');
      group.hidden = isCollapsed;
      for (const child of children) group.append(renderNode(child, nextAncestry, groupRecords));
      wrapper.append(group);
    }
    return wrapper;
  }

  function renderGroup(groupId, title, records) {
    const groupRecords = Object.fromEntries(records.map((record) => [record.url, record]));
    const group = document.createElement('section');
    group.className = 'group';
    const heading = document.createElement('h3');
    heading.className = 'group-title';
    heading.textContent = title;
    const isCollapsed = collapsedGroups.has(groupId);
    renderedGroupIds.add(groupId);
    const header = document.createElement('div');
    header.className = 'group-heading';
    const disclosure = document.createElement('button');
    disclosure.className = 'disclosure group-disclosure';
    disclosure.type = 'button';
    disclosure.setAttribute('aria-expanded', String(!isCollapsed));
    disclosure.setAttribute('aria-label', `${isCollapsed ? 'Expand' : 'Collapse'} ${title}`);
    disclosure.title = `${isCollapsed ? 'Expand' : 'Collapse'} ${title}`;
    disclosure.textContent = isCollapsed ? '\u25b8' : '\u25be';
    disclosure.addEventListener('click', () => {
      if (collapsedGroups.has(groupId)) collapsedGroups.delete(groupId);
      else collapsedGroups.add(groupId);
      render();
    });
    header.append(disclosure, heading);
    group.append(header);
    const content = document.createElement('div');
    content.hidden = isCollapsed;
    const roots = records
      .filter((record) => !record.parentUrl || !groupRecords[record.parentUrl])
      .sort((left, right) => (right.lastSeen || 0) - (left.lastSeen || 0));
    for (const root of roots) content.append(renderNode(root, new Set(), groupRecords));
    group.append(content);
    return group;
  }

  function renderFilterControls(projects, settings) {
    fitProjectOptions();
    includeRecentsInput.checked = settings.includeRecents;
    const optionsOpen = projectFilter.open;
    projectOptions.replaceChildren();
    const projectList = Object.values(projects).sort((left, right) => left.title.localeCompare(right.title));
    const selectedIds = settings.selectedProjectIds === null
      ? projectList.map((project) => project.id)
      : settings.selectedProjectIds;
    const selectedCount = projectList.filter((project) => selectedIds.includes(project.id)).length;
    projectFilter.querySelector('summary').textContent = `Projects (${selectedCount})`;
    projectFilter.open = optionsOpen;

    if (!projectList.length) {
      const empty = document.createElement('div');
      empty.className = 'filter-empty';
      empty.textContent = 'No projects found';
      projectOptions.append(empty);
      return;
    }

    for (const project of projectList) {
      const label = document.createElement('label');
      label.className = 'project-option';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = project.id;
      checkbox.checked = selectedIds.includes(project.id);
      checkbox.addEventListener('change', async () => {
        const nextSelectedIds = [...projectOptions.querySelectorAll('input:checked')].map((input) => input.value);
        settings.selectedProjectIds = nextSelectedIds;
        await saveFilterSettings(settings);
        render();
      });
      const name = document.createElement('span');
      name.textContent = project.title;
      label.append(checkbox, name);
      projectOptions.append(label);
    }
  }

  async function render(loadedRecords, loadedProjects) {
    const [records, projects, settings] = await Promise.all([
      loadedRecords || loadRecords(),
      loadedProjects || loadProjects(),
      loadFilterSettings()
    ]);
    resizePanel(settings.panelWidth || Math.min(360, window.innerWidth - 32));
    renderFilterControls(projects, settings);
    tree.replaceChildren();
    renderedGroupIds = new Set();
    renderedNodeIds = new Set();

    const selectedIds = settings.selectedProjectIds === null
      ? Object.keys(projects)
      : settings.selectedProjectIds;
    const shownInProject = new Set();
    for (const projectId of selectedIds) {
      const project = projects[projectId];
      if (!project) continue;
      const projectRecords = Object.values(records).filter((record) => record.projectIds?.includes(projectId));
      if (!projectRecords.length) continue;
      tree.append(renderGroup(projectId, project.title, projectRecords));
      for (const record of projectRecords) shownInProject.add(record.url);
    }

    if (settings.includeRecents) {
      const recentRecords = Object.values(records).filter((record) => record.inRecents && !shownInProject.has(record.url));
      if (recentRecords.length) tree.append(renderGroup('recents', 'Recents', recentRecords));
    }

    if (!tree.childElementCount) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No conversations match these filters.';
      tree.append(empty);
    }
  }

  let scanTimer;
  const scheduleScan = () => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 500);
  };
  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', scheduleScan);
  scan();
})();