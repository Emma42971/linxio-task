import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  FileText,
  Folder,
  User,
  Plus,
  Settings,
  Home,
  Calendar,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useOrganization } from '@/contexts/organization-context';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { TokenManager } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'workspace' | 'user' | 'sprint';
  title: string;
  description?: string;
  url?: string;
  context?: {
    workspace?: { name: string; slug: string };
    project?: { name: string; slug: string };
  };
  metadata?: Record<string, any>;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void | Promise<void>;
}

/**
 * CommandPalette Component
 * 
 * Global command palette with:
 * - Global search (tasks, projects, users)
 * - Quick actions (create task, create project, etc.)
 * - Quick navigation
 * - Keyboard shortcut: Cmd+K / Ctrl+K
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { universalSearch } = useOrganization();
  const { workspace, workspaces } = useWorkspaceContext();
  const { project, projects } = useProjectContext();
  const currentOrganizationId = TokenManager.getCurrentOrgId();
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch.trim() || debouncedSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      if (!currentOrganizationId) {
        return;
      }

      setLoading(true);
      try {
        const response = await universalSearch(
          debouncedSearch,
          currentOrganizationId,
          1,
          10,
        );

        const results: SearchResult[] = (response?.results || []).map((item: any) => ({
          id: item.id,
          type: item.type,
          title: item.title || item.name,
          description: item.description || item.content,
          url: item.url,
          context: item.context,
          metadata: item.metadata,
        }));

        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearch, currentOrganizationId, universalSearch]);

  // Get workspace slug helper
  const getWorkspaceSlug = useCallback((workspaceName: string): string => {
    return workspaceName.toLowerCase().replace(/\s+/g, '-');
  }, []);

  // Navigation handlers
  const navigateToTask = useCallback(
    (taskId: string, context?: { workspace?: any; project?: any }) => {
      if (context?.workspace && context?.project) {
        const wsSlug = getWorkspaceSlug(context.workspace.name);
        router.push(`/${wsSlug}/${context.project.slug}/tasks/${taskId}`);
      } else {
        router.push(`/tasks/${taskId}`);
      }
      setOpen(false);
    },
    [router, getWorkspaceSlug],
  );

  const navigateToProject = useCallback(
    (projectSlug: string, context?: { workspace?: any }) => {
      if (context?.workspace) {
        const wsSlug = getWorkspaceSlug(context.workspace.name);
        router.push(`/${wsSlug}/${projectSlug}`);
      } else {
        router.push(`/projects/${projectSlug}`);
      }
      setOpen(false);
    },
    [router, getWorkspaceSlug],
  );

  const navigateToWorkspace = useCallback(
    (workspaceName: string) => {
      const wsSlug = getWorkspaceSlug(workspaceName);
      router.push(`/${wsSlug}`);
      setOpen(false);
    },
    [router, getWorkspaceSlug],
  );

  // Quick actions
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'create-task',
        label: 'Create Task',
        description: 'Create a new task',
        icon: <Plus className="h-4 w-4" />,
        keywords: ['task', 'create', 'new', 'add'],
        action: () => {
          if (workspace && project) {
            router.push(`/${getWorkspaceSlug(workspace.name)}/${project.slug}/tasks?action=create`);
          } else {
            router.push('/tasks?action=create');
          }
          setOpen(false);
        },
      },
      {
        id: 'create-project',
        label: 'Create Project',
        description: 'Create a new project',
        icon: <Folder className="h-4 w-4" />,
        keywords: ['project', 'create', 'new', 'add'],
        action: () => {
          if (workspace) {
            router.push(`/${getWorkspaceSlug(workspace.name)}?action=create-project`);
          } else {
            router.push('/projects?action=create');
          }
          setOpen(false);
        },
      },
      {
        id: 'create-workspace',
        label: 'Create Workspace',
        description: 'Create a new workspace',
        icon: <Plus className="h-4 w-4" />,
        keywords: ['workspace', 'create', 'new', 'add'],
        action: () => {
          router.push('/?action=create-workspace');
          setOpen(false);
        },
      },
      {
        id: 'go-home',
        label: 'Go to Dashboard',
        description: 'Navigate to dashboard',
        icon: <Home className="h-4 w-4" />,
        keywords: ['home', 'dashboard', 'main'],
        action: () => {
          router.push('/');
          setOpen(false);
        },
      },
      {
        id: 'go-settings',
        label: 'Go to Settings',
        description: 'Open settings page',
        icon: <Settings className="h-4 w-4" />,
        keywords: ['settings', 'preferences', 'config'],
        action: () => {
          router.push('/settings');
          setOpen(false);
        },
      },
      {
        id: 'go-ai-chat',
        label: 'Open AI Chat',
        description: 'Open AI assistant chat',
        icon: <Sparkles className="h-4 w-4" />,
        keywords: ['ai', 'chat', 'assistant', 'help'],
        action: () => {
          // Toggle AI chat if available
          const event = new CustomEvent('toggle-ai-chat');
          window.dispatchEvent(event);
          setOpen(false);
        },
      },
    ],
    [router, workspace, project, getWorkspaceSlug],
  );

  // Filter quick actions based on search
  const filteredQuickActions = useMemo(() => {
    if (!searchQuery.trim()) {
      return quickActions;
    }

    const query = searchQuery.toLowerCase();
    return quickActions.filter((action) => {
      return (
        action.label.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query) ||
        action.keywords.some((keyword) => keyword.includes(query))
      );
    });
  }, [searchQuery, quickActions]);

  // Recent workspaces and projects for navigation
  const recentItems = useMemo(() => {
    const items: QuickAction[] = [];

    // Add current workspace if available
    if (workspace) {
      items.push({
        id: `workspace-${workspace.id}`,
        label: workspace.name,
        description: 'Current workspace',
        icon: <Folder className="h-4 w-4" />,
        keywords: ['workspace', workspace.name.toLowerCase()],
        action: () => navigateToWorkspace(workspace.name),
      });
    }

    // Add recent workspaces (limit 3)
    workspaces?.slice(0, 3).forEach((ws) => {
      if (ws.id !== workspace?.id) {
        items.push({
          id: `workspace-${ws.id}`,
          label: ws.name,
          description: 'Workspace',
          icon: <Folder className="h-4 w-4" />,
          keywords: ['workspace', ws.name.toLowerCase()],
          action: () => navigateToWorkspace(ws.name),
        });
      }
    });

    // Add current project if available
    if (project) {
      items.push({
        id: `project-${project.id}`,
        label: project.name,
        description: `Project in ${workspace?.name || 'workspace'}`,
        icon: <FileText className="h-4 w-4" />,
        keywords: ['project', project.name.toLowerCase()],
        action: () => {
          if (workspace) {
            navigateToProject(project.slug, { workspace });
          }
        },
      });
    }

    // Add recent projects (limit 3)
    projects?.slice(0, 3).forEach((proj) => {
      if (proj.id !== project?.id) {
        items.push({
          id: `project-${proj.id}`,
          label: proj.name,
          description: 'Project',
          icon: <FileText className="h-4 w-4" />,
          keywords: ['project', proj.name.toLowerCase()],
          action: () => {
            const ws = workspaces?.find((w) => w.id === proj.workspaceId);
            if (ws) {
              navigateToProject(proj.slug, { workspace: ws });
            }
          },
        });
      }
    });

    return items;
  }, [workspace, workspaces, project, projects, navigateToWorkspace, navigateToProject]);

  // Get icon for result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'project':
        return <Folder className="h-4 w-4" />;
      case 'workspace':
        return <Folder className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'sprint':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  // Handle result selection
  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      switch (result.type) {
        case 'task':
          navigateToTask(result.id, result.context);
          break;
        case 'project':
          if (result.context?.workspace) {
            navigateToProject(result.context.project?.slug || '', result.context);
          }
          break;
        case 'workspace':
          navigateToWorkspace(result.title);
          break;
        default:
          if (result.url) {
            router.push(result.url);
            setOpen(false);
          }
          break;
      }
    },
    [navigateToTask, navigateToProject, navigateToWorkspace, router],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type to search or run a command..." value={searchQuery} onValueChange={setSearchQuery} />
      <CommandList>
        <CommandEmpty>
          {loading ? 'Searching...' : searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No results found.'}
        </CommandEmpty>

        {/* Quick Actions */}
        {filteredQuickActions.length > 0 && (
          <>
            <CommandGroup heading="Quick Actions">
              {filteredQuickActions.map((action) => (
                <CommandItem key={action.id} onSelect={action.action}>
                  {action.icon}
                  <span>{action.label}</span>
                  <CommandShortcut>{action.description}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Recent Navigation */}
        {recentItems.length > 0 && !searchQuery && (
          <>
            <CommandGroup heading="Recent">
              {recentItems.map((item) => (
                <CommandItem key={item.id} onSelect={item.action}>
                  {item.icon}
                  <span>{item.label}</span>
                  <CommandShortcut>{item.description}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <CommandGroup heading="Search Results">
            {searchResults.map((result) => (
              <CommandItem key={result.id} onSelect={() => handleResultSelect(result)}>
                {getResultIcon(result.type)}
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  {result.description && (
                    <span className="text-xs text-muted-foreground">{result.description}</span>
                  )}
                  {result.context && (
                    <span className="text-xs text-muted-foreground">
                      {result.context.workspace?.name}
                      {result.context.project && ` • ${result.context.project.name}`}
                    </span>
                  )}
                </div>
                <CommandShortcut>
                  <ArrowRight className="h-4 w-4" />
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation Shortcuts */}
        {!searchQuery && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => router.push('/')}>
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => router.push('/tasks')}>
                <FileText className="h-4 w-4" />
                <span>All Tasks</span>
              </CommandItem>
              <CommandItem onSelect={() => router.push('/settings')}>
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}


