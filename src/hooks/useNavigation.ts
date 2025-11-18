import { useState, useCallback, useEffect, useRef } from 'react';
import { NavigationCommand, NavigationContext } from '@/types/mcp';
import { MCPServer } from '@/services/mcpServer';

interface NavigationState {
  currentView: string;
  currentIndex: number;
  videoPlaying: boolean;
  selectedPoint: string | null;
}

export const useNavigation = (
  initialState: NavigationState,
  handlers: {
    setViewMode: (mode: string) => void;
    setCurrentIndex: (index: number) => void;
    setVideoPlaying: (playing: boolean) => void;
    setSelectedPoint: (point: any) => void;
    handleDotClick: (index: number) => void;
    handleHomeClick: () => void;
    handleExitClick: () => void;
    handlePointInteraction: (point: any) => void;
  }
) => {
  const [mcpServer] = useState(() => new MCPServer());
  const [isGeminiInitialized, setIsGeminiInitialized] = useState(true);
  const navRef = useRef<NavigationState>(initialState);
  useEffect(() => { navRef.current = initialState; }, [initialState]);

  const initializeGemini = useCallback(() => {
    mcpServer.initializeGemini();
    setIsGeminiInitialized(true);
  }, [mcpServer]);

  const getNavigationContext = useCallback((): NavigationContext => ({
    currentView: navRef.current.currentView,
    currentIndex: navRef.current.currentIndex,
    videoPlaying: navRef.current.videoPlaying,
    selectedPoint: navRef.current.selectedPoint
  }), []);

  const executeNavigationCommand = useCallback((target: string, params?: any) => {
    console.log('🎬 executeNavigationCommand called');
    console.log('🎬 Target:', target);
    console.log('🎬 Params:', params);
    
    // ✅ CRITICAL: Handle openFile FIRST before any other logic
    if (params?.openFile) {
      console.log("✅ OPEN FILE DETECTED!");
      console.log("📝 File name:", params.openFile.name);
      console.log("📝 File content length:", params.openFile.content?.length);
      console.log("📝 File content preview:", params.openFile.content?.substring(0, 200));
      
      // Set view mode to split
      handlers.setViewMode("split");
      
      // Pass the file content to the editor
      const pointData = {
        id: params.openFile.name,
        x: 0,
        y: 0,
        label: params.openFile.name,
        code: params.openFile.content || "// Empty file",
        language: params.openFile.language || "cpp"
      };
      
      console.log("🎯 Calling handlePointInteraction with:", pointData);
      handlers.handlePointInteraction(pointData);
      
      console.log("✅ File opened successfully in editor");
      return; // ✅ Exit early - don't process other navigation logic
    }
    
    const t = (target || '').toLowerCase().replace(/\s+/g, '-');
    console.log('Normalized target:', t);
    
    switch (t) {
      case 'ruka-hand': {
        const page = 2;
        console.log('Navigating to Ruka Hand image page:', page);
        handlers.setViewMode('Amazing');
        handlers.setCurrentIndex(page);
        break;
      }
      
      case 'amazing-hand':
      case 'amazing-hand-preview': {
        const page = typeof params?.page === 'number' ? params.page : 0;
        console.log('Navigating to amazing-hand, page:', page);
        handlers.setViewMode('amazing-hand');
        handlers.setCurrentIndex(page);
        break;
      }
      
      case 'interactive-hand':
      case 'landing':
        console.log('Navigating to interactive-hand');
        handlers.handleDotClick(3);
        break;
        
      case 'next': {
        const idx = navRef.current.currentIndex;
        console.log('Navigating to next, current index:', idx);
        if (idx < 3) handlers.handleDotClick(idx + 1);
        break;
      }
      
      case 'previous':
      case 'back': {
        const idx = navRef.current.currentIndex;
        console.log('Navigating to previous, current index:', idx);
        if (idx > 0) handlers.handleDotClick(idx - 1);
        break;
      }
      
      case 'home':
      case 'video':
      case 'video-only':
      case 'live-video': {
        console.log('Navigating to Home Page (index 0)');
        handlers.setViewMode('Amazing');
        handlers.setCurrentIndex(0);
        break;
      }

      case 'split':
      case 'code':
      case 'editor': {
        console.log('Opening split mode');
        const defaultPoint = {
          id: 'point-0',
          x: 0,
          y: 0,
          label: 'Code Editor',
          code: "// Start coding here\n",
        };
        handlers.handlePointInteraction(defaultPoint);
        break;
      }
      
      case 'exit':
        console.log('Executing exit');
        handlers.handleExitClick();
        break;
        
      default:
        console.warn(`Unknown navigation target: ${target}`);
    }
  }, [handlers]); 

  const executeInteractionCommand = useCallback((target: string, params?: any) => {
    if (target.startsWith('dot-') || target.startsWith('point-')) {
      const pointNumber = parseInt(target.split('-')[1]);
      if (!isNaN(pointNumber)) {
        const mockPoint = {
          id: `point-${pointNumber}`,
          x: 0,
          y: 0,
          label: `Point ${pointNumber}`,
          code: `// Code for point ${pointNumber}\nconsole.log('Point ${pointNumber} activated');`
        };
        handlers.handlePointInteraction(mockPoint);
      }
    }
    if (target === 'editor:setFileContent') {
      console.log('Setting file content:', params);
      handlers.handlePointInteraction({
        id: params.fileName,
        x: 0,
        y: 0,
        label: params.fileName,
        code: params.content
      });
      return;
    }
  }, [handlers]);

  useEffect(() => {
    mcpServer.setNavigationCallbacks({
      navigate: executeNavigationCommand,
      interact: executeInteractionCommand,
      getContext: getNavigationContext
    });
  }, [mcpServer, executeNavigationCommand, executeInteractionCommand, getNavigationContext]);

  const processPrompt = useCallback(async (prompt: string): Promise<string> => {
    console.log('🎯 Processing prompt in useNavigation:', prompt);
    
    try {
      const result = await mcpServer.processPrompt(prompt);
      console.log('📥 MCP Server result:', result);
      console.log('📥 Result.command:', result.command);
      
      if (result.command) {
        console.log('🔧 Executing command from result:', result.command);
        
        switch (result.command.action) {
          case 'navigate':
            console.log('🚀 Action: navigate');
            console.log('🚀 Target:', result.command.target);
            console.log('🚀 OpenFile?:', !!result.command.openFile);
            
            // ✅ FIX: Pass the entire command object, not just parameters!
            executeNavigationCommand(result.command.target!, result.command);
            return result.response || `Navigated to ${result.command.target}`;
            
          case 'interact':
            console.log('🚀 Action: interact');
            executeInteractionCommand(result.command.target!, result.command.parameters);
            return result.response || `Interacted with ${result.command.target}`;
            
          case 'info':
            return result.response || result.command.parameters?.response || 'Information processed.';
        }
      }
      
      return result.response || 'Command processed successfully.';
    } catch (error) {
      console.error('❌ Error processing prompt:', error);
      return 'Sorry, I encountered an error processing your request. Please try again.';
    }
  }, [mcpServer, executeNavigationCommand, executeInteractionCommand]);

  return {
    processPrompt,
    initializeGemini,
    isGeminiInitialized,
    mcpServer
  };
};