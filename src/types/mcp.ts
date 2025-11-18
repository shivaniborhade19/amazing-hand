// MCP Server Types and Interfaces
export interface MCPRequest {
  id: string;
  method: string;
  params?: any;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

/**
 * ACTIONS: expanded to be flexible so server can return
 * natural navigation action names (previous, next, split, open, etc.)
 */
export type NavigationAction =
  | 'navigate'
  | 'interact'
  | 'info'
  | 'back'
  | 'previous'
  | 'next'
  | 'exit'
  | 'open'
  | 'split'
  | 'code'
  | 'editor';

export interface NavigationCommand {
  // allow a flexible set of action keywords (see NavigationAction)
  action: NavigationAction;
  target?: string;

  // optional parameters for navigation
  parameters?: Record<string, any>;

  // for opening a file in split mode
  openFile?: {
    name: string;
    content: string;
    language?: string;
  };

  // for setting content in editor
  fileName?: string;
  content?: string;
}

export interface NavigationContext {
  currentView: string;
  currentIndex: number;
  videoPlaying: boolean;
  selectedPoint: string | null;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}