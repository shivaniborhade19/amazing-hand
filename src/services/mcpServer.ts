import { MCPRequest, MCPResponse, MCPError, Tool, Resource, NavigationCommand, NavigationContext } from '@/types/mcp';
import { GeminiClient } from './geminiClient';
import IndividualFingerControl from '@/data/thumb.ino?raw';
import amazingHandCode from '@/data/Amazing_Hand_Demo(1).ino?raw';

function isCodeIntent(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return (
    p.includes("write code") ||
    p.includes("generate code") ||
    p.includes("arduino") ||
    p.includes("servo") ||
    p.includes("motor") ||
    p.includes("finger move") ||
    p.includes("move thumb") ||
    p.includes("control hand") ||
    p.includes("program")
  );
}

export class MCPServer {
  private tools: Tool[] = [];
  private resources: Resource[] = [];
  private geminiClient: GeminiClient;
  private navigationCallbacks: {
    navigate: (target: string, params?: any) => void;
    interact: (target: string, params?: any) => void;
    getContext: () => NavigationContext;
  } | null = null;

  constructor() {
    this.geminiClient = new GeminiClient();
    this.initializeTools();
    this.initializeResources();
  }

  // allow passing API key if desired
  initializeGemini(apiKey?: string) {
    // GeminiClient.initialize should handle optional apiKey
    this.geminiClient.initialize(apiKey);
  }

  setNavigationCallbacks(callbacks: {
    navigate: (target: string, params?: any) => void;
    interact: (target: string, params?: any) => void;
    getContext: () => NavigationContext;
  }) {
    this.navigationCallbacks = callbacks;
  }

  private initializeTools() {
    this.tools = [
      {
        name: 'navigate',
        description: 'Navigate to different pages in the interface',
        inputSchema: {
          type: 'object',
          properties: {
            target: {
              type: 'string',
              enum: ['ruka-hand', 'amazing-hand', 'interactive-hand', 'next', 'previous', 'back', 'home', 'exit', 'split', 'video', 'video-only', 'live-video']
            },
            parameters: {
              type: 'object'
            }
          },
          required: ['target']
        }
      },
      {
        name: 'interact',
        description: 'Interact with elements in the interface',
        inputSchema: {
          type: 'object',
          properties: {
            target: {
              type: 'string'
            },
            parameters: {
              type: 'object'
            }
          },
          required: ['target']
        }
      },
      {
        name: 'get_info',
        description: 'Get information about the interface or general topics',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string'
            }
          },
          required: ['query']
        }
      }
    ];
  }

  private initializeResources() {
    this.resources = [
      {
        uri: 'tenxer://navigation/context',
        name: 'Navigation Context',
        description: 'Current navigation state and context',
        mimeType: 'application/json'
      },
      {
        uri: 'tenxer://interface/help',
        name: 'Interface Help',
        description: 'Available commands and interface guide',
        mimeType: 'text/plain'
      }
    ];
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'tools/list':
          return {
            id: request.id,
            result: { tools: this.tools }
          };

        case 'resources/list':
          return {
            id: request.id,
            result: { resources: this.resources }
          };

        case 'tools/call':
          return await this.handleToolCall(request);

        case 'resources/read':
          return await this.handleResourceRead(request);

        default:
          return {
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`
            }
          };
      }
    } catch (error) {
      return {
        id: request.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private async handleToolCall(request: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'navigate':
        if (this.navigationCallbacks) {
          this.navigationCallbacks.navigate(args.target, args.parameters);
          return {
            id: request.id,
            result: { success: true, message: `Navigated to ${args.target}` }
          };
        }
        break;

      case 'interact':
        if (this.navigationCallbacks) {
          this.navigationCallbacks.interact(args.target, args.parameters);
          return {
            id: request.id,
            result: { success: true, message: `Interacted with ${args.target}` }
          };
        }
        break;

      case 'get_info':
        // General Q&A disabled: return guidance instead of calling Gemini
        return {
          id: request.id,
          result: { response: "General Q&A is disabled for this demo. Use navigation commands like 'go to ruka hand', 'next page', 'open split', 'home', or 'click dot 1'." }
        };
    }

    return {
      id: request.id,
      error: {
        code: -32602,
        message: 'Invalid params'
      }
    };
  }

  private async handleResourceRead(request: MCPRequest): Promise<MCPResponse> {
    const { uri } = request.params;

    switch (uri) {
      case 'tenxer://navigation/context':
        const context = this.navigationCallbacks?.getContext();
        return {
          id: request.id,
          result: {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(context, null, 2)
            }]
          }
        };

      case 'tenxer://interface/help':
        const helpText = `
TenXer Interface Navigation Commands:

BASIC NAVIGATION:
- "go to ruka hand" - Navigate to Ruka Hand page
- "go to amazing hand" - Navigate to Amazing Hand preview  
- "go to interactive hand" - Navigate to interactive hand with dots
- "next page" / "previous page" - Navigate between pages
- "home" - Play video mode
- "exit" - Exit current mode

INTERACTION:
- "click dot [number]" - Interact with specific dot on hand
- "show code for [feature]" - Display code for hand features

GENERAL:
- Ask any question about robotics, automation, or the interface
        `;
        return {
          id: request.id,
          result: {
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: helpText
            }]
          }
        };

      default:
        return {
          id: request.id,
          error: {
            code: -32602,
            message: `Resource not found: ${uri}`
          }
        };
    }
  }

  /**
   * processPrompt: main intent handler
   * - local quick parses
   * - code-intent -> open blank editor immediately + generate code + fill editor
   * - navigation/interaction via Gemini analysis as fallback
   */
  async processPrompt(
    prompt: string
  ): Promise<{ command?: NavigationCommand; response?: string }> {
    if (!this.navigationCallbacks) {
      throw new Error('Navigation callbacks not set');
    }

    const context = this.navigationCallbacks.getContext();
    const lower = prompt.toLowerCase();

    // "make changes" triggers
    const changeKeywords = ['change', 'edit', 'modify', 'customize', 'update', 'alter'];
    const handKeywords = ['hand', 'finger', 'joint', 'movement', 'robotic hand', 'tenxer'];
    const makeChangesPattern =
      changeKeywords.some(k => lower.includes(k)) &&
      handKeywords.some(k => lower.includes(k));

    // navigation & info keywords
    const informationKeywords = [
      'what is', 'tell me about', 'information about',
      'explain', 'describe', 'how does', 'why'
    ];

    const navigationOnlyKeywords = [
      'go to', 'open page', 'navigate to', 'show page', 'switch page',
      'next page', 'previous page', 'home page', 'exit page'
    ];

    const isInformationRequest = informationKeywords.some(k => lower.includes(k));
    const isLikelyNavigation = navigationOnlyKeywords.some(k => lower.includes(k));

    // code intent keywords (you asked: when user asks to write/generate code)
    const codeIntentKeywords = [
      'write code', 'generate code', 'create code', 'code for', 'code to',
      'move thumb', 'move finger', 'move index', 'move middle', 'move ring', 'move pinky',
      'control servo', 'control motor', 'bend finger', 'close hand', 'open hand',
      'lift finger', 'rotate finger', 'servo code', 'motor code'
    ];
    

    // -------------------------
    // 1) Local quick parsing (run BEFORE code-intent open so explicit nav commands are fast)
    // -------------------------
    const localParse = (): { command?: NavigationCommand; response?: string } | null => {
      const p = lower;
      const match = p.match(/(?:dot|point)\s*(\d+)/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (!isNaN(idx)) {
          return {
            command: { action: 'interact', target: `dot-${idx}` },
            response: `Interacting with dot ${idx}`
          };
        }
      }

      const has = (...keys: string[]) => keys.some(k => p.includes(k));

      if (has('back', 'previous', 'prev', 'go back')) {
        return { command: { action: 'navigate', target: 'previous' }, response: 'Going back.' };
      }
      if (has('next', 'forward')) {
        return { command: { action: 'navigate', target: 'next' }, response: 'Next page.' };
      }

      if (has('ruka', 'rukka', 'ruka hand')) {
        return {
          command: { action: 'navigate', target: 'ruka-hand', parameters: { page: 2 } },
          response: 'Opening Ruka Hand page...'
        };
      }

      if (has('amazing hand', 'open amazing', 'go to amazing')) {
        return {
          command: { action: 'navigate', target: 'amazing-hand', parameters: { page: 0 } },
          response: 'Opening Amazing Hand...'
        };
      }

      if (has('interactive', 'dots')) {
        return { command: { action: 'navigate', target: 'interactive-hand' }, response: 'Opening Interactive Hand...' };
      }

      if (has('home', 'go home')) {
        return { command: { action: 'navigate', target: 'home', parameters: { page: 0 } }, response: 'Going home...' };
      }

      if (has('open editor', 'split mode', 'open code page')) {
        return { command: { action: 'navigate', target: 'split' }, response: 'Opening split view...' };
      }

      if (has('exit', 'close')) {
        return { command: { action: 'navigate', target: 'exit' }, response: 'Exiting.' };
      }

      return null;
    };

    // Run local parse first (so explicit nav commands are immediate)
    try {
      const local = localParse();
      if (local) return local;
    } catch (err) {
      console.error('localParse error:', err);
    }

    // -------------------------
    // 2) Code intent handling: open blank editor immediately, then generate code and fill it
    // -------------------------
    // ------------------------------------------------------
// 1. Check if user wants GENRATED CODE (special mode)
// ------------------------------------------------------
if (isCodeIntent(prompt)) {
  console.log("CODE INTENT DETECTED — Generating code...");

  try {
    // 1. Load reference files (TYPE SAFE)
    const thumbCode: string = await import("@/data/thumb.ino?raw")
      .then((m) => String(m.default))
      .catch(() => "");

    const amazingHand: string = await import("@/data/Amazing_Hand_Demo(1).ino?raw")
      .then((m) => String(m.default))
      .catch(() => "");

    const contextFiles = [
      { name: "thumb.ino", content: thumbCode },
      { name: "Amazing_Hand_Demo.ino", content: amazingHand },
    ];

    // 2. Ask Gemini to generate code
    console.log("ASKING GEMINI FOR CODE...");
    const code = await this.geminiClient.getCodeOnly(prompt, contextFiles);
    console.log("GENERATED CODE:", code);

    // 3. Return command to open split mode with the generated code
    return {
      command: {
        action: "navigate",
        target: "split",
        openFile: {
          name: "generated_code.ino",
          content: code,     // ✅ GEMINI GENERATED CODE
          language: "cpp",
        },
      },
      response: "Here is the generated code for your request!",
    };
  } catch (error) {
    console.error("Code generation error:", error);
    return {
      command: {
        action: "navigate",
        target: "split",
        openFile: {
          name: "generated_code.ino",
          content: "// Error generating code gemini fails. Please try again.",
          language: "cpp",
        },
      },
      response: "Sorry, I encountered an error generating the code.gemini fails",
    };
  }
}

    // -------------------------
    // 3) Special "make changes" handling: open split mode for editing
    // -------------------------
    if (makeChangesPattern) {
      try {
        const analysis = await this.geminiClient.analyzeNavigationIntent(prompt, context);
        const cmd: NavigationCommand = { action: 'navigate', target: 'split' };
        return { command: cmd, response: analysis.response || 'Opening split mode so you can modify code.' };
      } catch (err) {
        console.error('analyzeNavigationIntent error:', err);
        return { command: { action: 'navigate', target: 'split' }, response: 'Opening split mode for editing.' };
      }
    }

    // -------------------------
    // 4) Info requests
    // -------------------------
    if (isInformationRequest) {
      try {
        const general = await this.geminiClient.getGeneralResponse(prompt);
        return { response: general };
      } catch (err) {
        console.error('getGeneralResponse error:', err);
      }
    }

    // -------------------------
    // 5) AI navigation analysis fallback (ask Gemini what to do)
    // -------------------------
    if (isLikelyNavigation && !isInformationRequest) {
      try {
        const analysis = await this.geminiClient.analyzeNavigationIntent(prompt, context);

        if (analysis.confidence >= 50) {
          // coerce action into NavigationCommand.action set
          const actionAsNav = (analysis.action || 'navigate') as NavigationCommand['action'];

          const navCmd: NavigationCommand = {
            action: actionAsNav,
            target: analysis.target,
            parameters: analysis.parameters,
            // allow openFile if provided directly by analysis (rare)
            openFile: (analysis as any).openFile
          };

          return { command: navCmd, response: analysis.response };
        }
      } catch (err) {
        console.error('analyzeNavigationIntent error:', err);
      }
    }

    // -------------------------
    // 6) Final fallback -> general response
    // -------------------------
    try {
      const general = await this.geminiClient.getGeneralResponse(prompt);
      return { response: general };
    } catch (err) {
      console.error('final getGeneralResponse error:', err);
      return { response: 'Sorry, I could not understand that.' };
    }
  }
}
