import { createRoot } from 'react-dom/client';
import { ForkMap } from './ForkMap';
import { forkMapStyles } from './styles';
import type { ConversationMap, FilterSettings, ProjectMap } from './types';

declare global {
  interface Window {
    __perplexityForkMapLoaded?: boolean;
  }
}

const recordsStorageKey = 'perplexityForkMap';
const projectsStorageKey = 'perplexityForkMapProjects';
const filtersStorageKey = 'perplexityForkMapFilters';
const conversationPath = /\/(search|thread|conversation|session)\//i;
const pageKey = () => `${location.origin}${location.pathname}`;

if (!window.__perplexityForkMapLoaded) {
  window.__perplexityForkMapLoaded = true;

  const host = document.createElement('div');
  host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; right: 20px; bottom: 20px;';
  document.documentElement.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = forkMapStyles;
  const mount = document.createElement('div');
  mount.className = 'fork-map-root';
  shadow.append(style, mount);

  const root = createRoot(mount);
  let records: ConversationMap = {};
  let projects: ProjectMap = {};
  let settings: FilterSettings = { includeRecents: true, selectedProjectIds: null };
  let initialized = false;
  let scanTimer: number | undefined;

  function getStorage(keys: string[]): Promise<Record<string, unknown>> {
    return chrome.storage.local.get(keys);
  }

  function setStorage(items: Record<string, unknown>): Promise<void> {
    return chrome.storage.local.set(items);
  }

  function renderApp(): void {
    root.render(
      <ForkMap
        records={records}
        projects={projects}
        settings={settings}
        onSettingsChange={(nextSettings) => {
          settings = nextSettings;
          void setStorage({ [filtersStorageKey]: nextSettings });
          renderApp();
        }}
      />
    );
  }

  function isConversationUrl(href: string): boolean {
    try {
      const url = new URL(href, location.origin);
      return url.origin === location.origin && conversationPath.test(url.pathname);
    } catch {
      return false;
    }
  }

  function canonicalUrl(href: string): string {
    const url = new URL(href, location.origin);
    return url.origin + url.pathname;
  }

  function titleFromUrl(href: string): string {
    const url = new URL(href, location.origin);
    const slug = url.pathname.split('/').filter(Boolean).pop() || 'Conversation';
    return decodeURIComponent(slug).replace(/-[0-9a-f]{8}(-[0-9a-f-]{20,})?$/i, '').replace(/-/g, ' ');
  }

  function anchorLabel(anchor: HTMLAnchorElement): string {
    return anchor.innerText.trim().replace(/^Continued from\s*/i, '').trim()
      || anchor.getAttribute('aria-label')?.trim().replace(/^Continued from\s*/i, '').trim()
      || anchor.title.trim();
  }

  function conversationTitle(href: string, anchor?: HTMLAnchorElement): string {
    const linkTitle = anchor ? anchorLabel(anchor) : '';
    if (linkTitle) return linkTitle;
    const heading = document.querySelector<HTMLElement>('main h1')?.innerText.trim();
    if (canonicalUrl(href) === pageKey() && heading && !/what do you want to know|what should we work on/i.test(heading)) return heading;
    const documentTitle = document.title.replace(/\s*[|–-]\s*Perplexity\s*$/i, '').trim();
    if (canonicalUrl(href) === pageKey() && documentTitle && documentTitle !== 'Perplexity') return documentTitle;
    return titleFromUrl(href);
  }

  function parentConversation(): { url: string; title: string } | null {
    const labels = [...document.querySelectorAll('body *')].filter((element) => {
      return element.children.length === 0 && element.textContent?.trim() === 'Continued from';
    });
    for (const label of labels) {
      let ancestor = label.parentElement;
      for (let depth = 0; ancestor && depth < 5; depth += 1, ancestor = ancestor.parentElement) {
        const link = [...ancestor.querySelectorAll<HTMLAnchorElement>('a[href]')].find((candidate) => {
          return isConversationUrl(candidate.href) && canonicalUrl(candidate.href) !== pageKey();
        });
        if (link) {
          const title = anchorLabel(link);
          return { url: canonicalUrl(link.href), title: title || titleFromUrl(link.href) };
        }
      }
    }
    return null;
  }

  function sectionItems(label: string, sectionPath: string, followingPath?: string): HTMLElement[] {
    const textNode = [...document.querySelectorAll('body *')].find((element) => {
      return element.children.length === 0 && element.textContent?.trim() === label;
    });
    if (!textNode) return [];

    let headerRow: Element | null = textNode;
    for (let depth = 0; headerRow && depth < 6; depth += 1, headerRow = headerRow.parentElement) {
      const hasSectionLink = [...headerRow.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
        return new URL(anchor.href, location.origin).pathname === sectionPath;
      });
      if (hasSectionLink) break;
    }
    if (!headerRow) return [];
    const sectionContainer = headerRow.parentElement;
    if (!sectionContainer) return [];

    const siblings = [...sectionContainer.children];
    const start = siblings.indexOf(headerRow) + 1;
    let end = siblings.length;
    if (followingPath) {
      const nextSection = siblings.findIndex((sibling, index) => {
        return index >= start && [...sibling.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
          return new URL(anchor.href, location.origin).pathname === followingPath;
        });
      });
      if (nextSection >= 0) end = nextSection;
    }
    return siblings.slice(start, end) as HTMLElement[];
  }

  function projectForConversation(anchor: HTMLAnchorElement, boundary: HTMLElement): { id: string; title: string } | null {
    for (let ancestor = anchor.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const projectLink = [...ancestor.querySelectorAll<HTMLAnchorElement>('a[href]')].find((candidate) => {
        if (candidate === anchor || isConversationUrl(candidate.href)) return false;
        const path = new URL(candidate.href, location.origin).pathname;
        return path !== '/projects' && path !== '/library' && Boolean(anchorLabel(candidate));
      });
      if (projectLink) {
        return { id: canonicalUrl(projectLink.href), title: anchorLabel(projectLink) };
      }
      if (ancestor === boundary) break;
    }
    return null;
  }

  function sidebarConversations(): { projects: Record<string, { id: string; title: string; conversations: Array<{ url: string; title: string }> }>; recents: Array<{ url: string; title: string }> } {
    const sidebarProjects: Record<string, { id: string; title: string; conversations: Array<{ url: string; title: string }> }> = {};
    const projectItems = sectionItems('Projects', '/projects', '/library');
    for (const projectItem of projectItems) {
      const links = [...projectItem.querySelectorAll<HTMLAnchorElement>('a[href]')].filter((anchor) => isConversationUrl(anchor.href));
      for (const anchor of links) {
        const project = projectForConversation(anchor, projectItem);
        if (!project) continue;
        const item = { url: canonicalUrl(anchor.href), title: conversationTitle(anchor.href, anchor) };
        sidebarProjects[project.id] ||= { ...project, conversations: [] };
        if (!sidebarProjects[project.id].conversations.some((conversation) => conversation.url === item.url)) {
          sidebarProjects[project.id].conversations.push(item);
        }
      }
    }

    const recentItems = sectionItems('Recents', '/library');
    const recents = recentItems.flatMap((item) => [...item.querySelectorAll<HTMLAnchorElement>('a[href]')]
      .filter((anchor) => isConversationUrl(anchor.href))
      .map((anchor) => ({ url: canonicalUrl(anchor.href), title: conversationTitle(anchor.href, anchor) })));
    return { projects: sidebarProjects, recents };
  }

  function scheduleScan(): void {
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(() => void scan(), 500);
  }

  async function scan(): Promise<void> {
    if (!initialized) return;
    const timestamp = Date.now();
    for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      if (!isConversationUrl(anchor.href)) continue;
      const url = canonicalUrl(anchor.href);
      records[url] = { ...records[url], url, title: conversationTitle(anchor.href, anchor), lastSeen: timestamp };
    }

    const sidebar = sidebarConversations();
    for (const project of Object.values(sidebar.projects)) {
      projects[project.id] = { id: project.id, title: project.title };
      for (const conversation of project.conversations) {
        const current = records[conversation.url] || { url: conversation.url };
        records[conversation.url] = {
          ...current,
          title: conversation.title || current.title,
          projectIds: [...new Set([...(current.projectIds || []), project.id])],
          lastSeen: timestamp
        };
      }
    }
    for (const conversation of sidebar.recents) {
      const current = records[conversation.url] || { url: conversation.url };
      records[conversation.url] = { ...current, title: conversation.title || current.title, inRecents: true, lastSeen: timestamp };
    }

    if (conversationPath.test(location.pathname)) {
      const parent = parentConversation();
      const currentAnchor = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
        .find((anchor) => isConversationUrl(anchor.href) && canonicalUrl(anchor.href) === pageKey());
      const current = records[pageKey()] || {};
      records[pageKey()] = {
        ...current,
        url: pageKey(),
        title: conversationTitle(location.href, currentAnchor),
        parentUrl: parent?.url || current.parentUrl || '',
        parentTitle: parent?.title || current.parentTitle || '',
        lastSeen: timestamp
      };
      if (parent && !records[parent.url]) {
        records[parent.url] = { url: parent.url, title: parent.title, lastSeen: timestamp - 1 };
      }
    }

    await chrome.storage.local.set({ [recordsStorageKey]: records, [projectsStorageKey]: projects });
    renderApp();
  }

  async function initialize(): Promise<void> {
    const stored = await getStorage([recordsStorageKey, projectsStorageKey, filtersStorageKey]);
    records = (stored[recordsStorageKey] as ConversationMap | undefined) || {};
    projects = (stored[projectsStorageKey] as ProjectMap | undefined) || {};
    settings = {
      includeRecents: true,
      selectedProjectIds: null,
      ...(stored[filtersStorageKey] as Partial<FilterSettings> | undefined)
    };
    initialized = true;
    renderApp();
    await scan();
  }

  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', scheduleScan);
  void initialize();
}