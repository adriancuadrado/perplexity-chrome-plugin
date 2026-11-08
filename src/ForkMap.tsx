import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { ConversationMap, ConversationRecord, FilterSettings, ProjectMap } from './types';

interface ForkMapProps {
  records: ConversationMap;
  projects: ProjectMap;
  settings: FilterSettings;
  onSettingsChange: (settings: FilterSettings) => void;
}

interface ConversationGroup {
  id: string;
  title: string;
  records: ConversationRecord[];
}

interface ConversationNodeProps {
  record: ConversationRecord;
  currentUrl: string;
  records: ConversationMap;
  ancestry: Set<string>;
  collapsedNodes: Set<string>;
  onToggle: (url: string) => void;
}

function ConversationNode({ record, currentUrl, records, ancestry, collapsedNodes, onToggle }: ConversationNodeProps) {
  const children = Object.values(records)
    .filter((child) => child.parentUrl === record.url && !ancestry.has(child.url))
    .sort((left, right) => (right.lastSeen || 0) - (left.lastSeen || 0));
  const isCollapsed = collapsedNodes.has(record.url);
  const isCurrent = record.url === currentUrl;
  const nextAncestry = new Set(ancestry);
  nextAncestry.add(record.url);

  return (
    <div className="node" role="treeitem" aria-expanded={children.length ? !isCollapsed : undefined}>
      <div className="node-row">
        {children.length ? (
          <button
            className="disclosure node-disclosure"
            type="button"
            aria-expanded={!isCollapsed}
            aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${record.title || 'conversation'}`}
            title={`${isCollapsed ? 'Expand' : 'Collapse'} conversation`}
            onClick={() => onToggle(record.url)}
          >
            {isCollapsed ? '\u25b8' : '\u25be'}
          </button>
        ) : <span className="disclosure-spacer" />}
        <a
          className={`node-link${isCurrent ? ' current' : ''}${record.placeholder ? ' placeholder' : ''}`}
          href={record.url}
          title={record.title || 'Untitled conversation'}
          aria-current={isCurrent ? 'page' : undefined}
        >
          <span>{record.title || 'Untitled conversation'}</span>
          {isCurrent && <span className="badge">Current</span>}
        </a>
      </div>
      {children.length > 0 && !isCollapsed && (
        <div className="children" role="group">
          {children.map((child) => (
            <ConversationNode
              key={child.url}
              record={child}
              currentUrl={currentUrl}
              records={records}
              ancestry={nextAncestry}
              collapsedNodes={collapsedNodes}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function childrenByGroup(records: ConversationRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const record of records) {
    if (records.some((candidate) => candidate.parentUrl === record.url)) ids.add(record.url);
  }
  return ids;
}

function collectGroups(records: ConversationMap, projects: ProjectMap, settings: FilterSettings): ConversationGroup[] {
  const selectedIds = settings.selectedProjectIds === null
    ? Object.keys(projects)
    : settings.selectedProjectIds;
  const groups: ConversationGroup[] = [];
  const shownInProject = new Set<string>();

  for (const projectId of selectedIds) {
    const project = projects[projectId];
    if (!project) continue;
    const projectRecords = Object.values(records).filter((record) => record.projectIds?.includes(projectId));
    if (projectRecords.length === 0) continue;
    groups.push({ id: projectId, title: project.title, records: projectRecords });
    for (const record of projectRecords) shownInProject.add(record.url);
  }

  if (settings.includeRecents) {
    const recentRecords = Object.values(records).filter((record) => record.inRecents && !shownInProject.has(record.url));
    if (recentRecords.length > 0) groups.push({ id: 'recents', title: 'Recents', records: recentRecords });
  }

  return groups;
}

export function ForkMap({ records, projects, settings, onSettingsChange }: ForkMapProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(settings.panelWidth ?? Math.min(360, window.innerWidth - 32));
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() => new Set());
  const resizeStart = useRef<{ pointerId: number; clientX: number; width: number } | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const groups = collectGroups(records, projects, settings);
  const groupIds = groups.map((group) => group.id);
  const nodeIds = [...new Set(groups.flatMap((group) => [...childrenByGroup(group.records)]))];

  useEffect(() => {
    if (settings.panelWidth) setWidth(settings.panelWidth);
  }, [settings.panelWidth]);

  const clampWidth = (requestedWidth: number) => {
    const maximum = Math.max(160, window.innerWidth - 32);
    const minimum = Math.min(260, maximum);
    return Math.min(Math.max(requestedWidth, minimum), maximum);
  };

  const resizeTo = (requestedWidth: number, persist = false) => {
    const nextWidth = clampWidth(requestedWidth);
    setWidth(nextWidth);
    if (persist) onSettingsChange({ ...settings, panelWidth: nextWidth });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    resizeStart.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      width: panelRef.current?.getBoundingClientRect().width ?? width
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = resizeStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    resizeTo(start.width + start.clientX - event.clientX);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = resizeStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    resizeStart.current = null;
    onSettingsChange({ ...settings, panelWidth: clampWidth(start.width + start.clientX - event.clientX) });
  };

  const handleResizeKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    resizeTo(width + (event.key === 'ArrowLeft' ? 16 : -16), true);
    event.preventDefault();
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleNode = (url: string) => {
    setCollapsedNodes((previous) => {
      const next = new Set(previous);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedGroups(new Set(groupIds));
    setCollapsedNodes(new Set(nodeIds));
  };

  const expandAll = () => {
    setCollapsedGroups(new Set());
    setCollapsedNodes(new Set());
  };

  const selectProject = (projectId: string, checked: boolean) => {
    const selectedIds = settings.selectedProjectIds === null ? Object.keys(projects) : settings.selectedProjectIds;
    const next = new Set(selectedIds);
    if (checked) next.add(projectId);
    else next.delete(projectId);
    onSettingsChange({ ...settings, selectedProjectIds: [...next] });
  };

  const projectList = Object.values(projects).sort((left, right) => left.title.localeCompare(right.title));
  const selectedIds = settings.selectedProjectIds === null ? projectList.map((project) => project.id) : settings.selectedProjectIds;

  return (
    <>
      <section
        ref={panelRef}
        className={`panel${isOpen ? ' open' : ''}`}
        aria-label="Conversation fork map"
        style={{ width }}
      >
        <div
          className="resize-handle"
          role="separator"
          aria-label="Resize conversation fork map"
          aria-orientation="vertical"
          aria-valuemin={Math.min(260, Math.max(160, window.innerWidth - 32))}
          aria-valuemax={Math.max(160, window.innerWidth - 32)}
          aria-valuenow={Math.round(width)}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleResizeKey}
        />
        <header className="panel-header">
          <h2>Conversation forks</h2>
          <button className="close" type="button" aria-label="Close fork map" title="Close" onClick={() => setIsOpen(false)}>&times;</button>
        </header>
        <div className="filters">
          <label className="recent-option">
            <input
              type="checkbox"
              checked={settings.includeRecents}
              onChange={(event) => onSettingsChange({ ...settings, includeRecents: event.currentTarget.checked })}
            />
            <span>Include Recents</span>
          </label>
          <details className="filter-control project-filter">
            <summary>Projects ({projectList.filter((project) => selectedIds.includes(project.id)).length})</summary>
            <div className="project-options">
              {projectList.length === 0 ? <div className="filter-empty">No projects found</div> : projectList.map((project) => (
                <label key={project.id} className="project-option">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(project.id)}
                    onChange={(event) => selectProject(project.id, event.currentTarget.checked)}
                  />
                  <span>{project.title}</span>
                </label>
              ))}
            </div>
          </details>
        </div>
        <div className="tree-actions" role="toolbar" aria-label="Conversation tree controls">
          <button className="tree-action collapse-all" type="button" onClick={collapseAll}>Collapse all</button>
          <button className="tree-action expand-all" type="button" onClick={expandAll}>Expand all</button>
        </div>
        <div className="tree" role="tree">
          {groups.length === 0 ? <p className="empty">No conversations match these filters.</p> : groups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.id);
            const groupRecords = Object.fromEntries(group.records.map((record) => [record.url, record]));
            const roots = group.records
              .filter((record) => !record.parentUrl || !groupRecords[record.parentUrl])
              .sort((left, right) => (right.lastSeen || 0) - (left.lastSeen || 0));
            return (
              <section key={group.id} className="group" role="group" aria-label={group.title}>
                <div className="group-heading">
                  <button
                    className="disclosure group-disclosure"
                    type="button"
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.title}`}
                    title={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.title}`}
                    onClick={() => toggleGroup(group.id)}
                  >
                    {isCollapsed ? '\u25b8' : '\u25be'}
                  </button>
                  <h3 className="group-title">{group.title}</h3>
                </div>
                {!isCollapsed && roots.map((record) => (
                  <ConversationNode
                    key={record.url}
                    record={record}
                    currentUrl={`${location.origin}${location.pathname}`}
                    records={groupRecords}
                    ancestry={new Set()}
                    collapsedNodes={collapsedNodes}
                    onToggle={toggleNode}
                  />
                ))}
              </section>
            );
          })}
        </div>
      </section>
      <button
        className="toggle"
        type="button"
        aria-label={`${isOpen ? 'Close' : 'Open'} conversation fork map`}
        title="Conversation forks"
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 4v5a4 4 0 0 0 4 4h6" />
          <path d="m14 9 3 4-3 4" />
          <path d="M7 20v-3" />
        </svg>
      </button>
    </>
  );
}