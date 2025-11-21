import { GoogleGenerativeAI } from '@google/generative-ai';
import { NavigationCommand, NavigationContext } from '@/types/mcp';

// Assuming you have defined VITE_GEMINI_API_KEY in your .env file:
// VITE_GEMINI_API_KEY="YOUR_ACTUAL_CORRECT_GEMINI_API_KEY_HERE"

export class GeminiClient {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  
  // NOTE: You can remove the hardcoded API_KEY line completely.
  // private static readonly API_KEY = "AIzaSyDfMcTZ1MdUsRH_9XOfgsEdw9GDkOTm0tw"; 

  constructor() {
    this.initialize();
  }

  initialize() {
    // 1. Get the key from the environment variable exposed by Vite
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Gemini API Key is missing. Check your .env file for VITE_GEMINI_API_KEY.");
      return; // Exit if the key is not found
    }

    // 2. Initialize the GoogleGenerativeAI class with the key
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }


  async analyzeNavigationIntent(prompt: string, context: NavigationContext): Promise<{
    action: 'navigate' | 'interact' | 'info';
    target?: string; 
    parameters?: Record<string, any>;
    confidence: number;
    reasoning: string;
    response: string;
  }> {
    if (!this.model) {
      throw new Error('Gemini API not initialized. Please provide API key.');
    }

    // Check if user is asking about Amazing Hand details
    const amazingHandKeywords = ['amazing hand', 'tell me about amazing', 'details about amazing', 'what is amazing hand', 'amazing hand information'];
    const isAskingAboutAmazingHand = amazingHandKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );


    // Check if user is asking about making changes to the hand
    const changeKeywords = ['change', 'edit', 'modify', 'customize', 'update', 'code', 'programming'];
    const handKeywords = ['hand', 'finger', 'joint', 'movement'];
    const isAskingAboutChanges = changeKeywords.some(change => 
      prompt.toLowerCase().includes(change.toLowerCase())
    ) && handKeywords.some(hand => 
      prompt.toLowerCase().includes(hand.toLowerCase())
    );

    const systemPrompt = `You are an intelligent navigation assistant for a robotic hand interface called TenXer. 

CURRENT CONTEXT:
- Current view: ${context.currentView}
- Current page index: ${context.currentIndex} (0=Ruka Hand (first), 1=Ruka Hand (second), 2=Amazing Hand Preview, 3=Interactive Hand with dots)
- Video playing: ${context.videoPlaying}
- Selected point: ${context.selectedPoint || 'none'}

AVAILABLE NAVIGATION TARGETS:
- "ruka-hand" (page 0 or 1 via parameters.page): Shows the Ruka Hand image
- "amazing-hand" (page 2): Shows Amazing Hand preview image  
- "interactive-hand" (page 3): Shows interactive hand with clickable dots
- "split": Open split mode (hand + code editor) - USE THIS when users want to make changes, edit, or code
- "next": Move to next page
- "previous": Move to previous page
- "home": Toggle video mode
- "exit": Exit current view

INTERACTION TARGETS:
- "dot-1", "dot-2", "point-1", "point-2", etc.: Click specific dots on interactive hand

SPECIAL HANDLING:
- If user asks about MAKING CHANGES/EDITING the hand: → navigate to "split" and explain they need the code editor
- If user wants to go to specific hand pages: → provide encouraging response and navigate there

YOUR TASK: Analyze the user's prompt intelligently and determine:
1. What ACTION they want: "navigate", "interact", or "info"
2. What TARGET (if navigation/interaction)
3. Your CONFIDENCE level (0-100)
4. Your REASONING for this decision
5. A helpful RESPONSE to the user

Be smart about understanding different ways people express the same intent:
- "How do I change this hand?", "edit the hand", "modify movements" → navigate to "split" (code editor)
- "show ruka hand", "go to ruka", "ruka page", "first page" → navigate to "ruka-hand" with parameters.page=0
- "amazing hand details", "tell me about amazing hand" → info with "fetch-amazing-hand"
- "interactive", "dots", "landing" → navigate to "interactive-hand"
- "open code", "split mode", "editor" → navigate to "split"

Return ONLY valid JSON with this exact structure:
{
  "action": "navigate",
  "target": "split",
  "confidence": 95,
  "reasoning": "User wants to make changes to the hand, which requires the code editor",
  "response": "To make changes to the hand, you'll need the code editor. Opening split mode now!"
}`;

    try {
      let enrichedPrompt = prompt;
      

      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: `Analyze this user prompt: "${enrichedPrompt}"` }
      ]);

      const responseText = result.response.text().trim();
      
      // Try to extract JSON from the response
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Enhance response for specific cases
        if (isAskingAboutChanges && analysis.action === 'navigate' && analysis.target === 'split') {
          analysis.response = "To make changes to the hand, you'll need to access the code editor. Let me open split mode where you can see the hand and edit its code simultaneously!";
        }
        
        return {
          action: analysis.action || 'info',
          target: analysis.target || undefined,
          parameters: analysis.parameters || undefined,
          confidence: analysis.confidence || 50,
          reasoning: analysis.reasoning || 'AI analysis performed',
          response: analysis.response || responseText
        };
      }

      // Fallback if JSON parsing fails
      return {
        action: 'info',
        confidence: 30,
        reasoning: 'Failed to parse AI response as structured data',
        response: responseText || 'I analyzed your request but couldn\'t determine a specific action.'
      };
    } catch (error) {
      console.error('Error analyzing navigation intent:', error);
      return {
        action: 'info',
        confidence: 0,
        reasoning: 'Error occurred during AI analysis',
        response: 'I encountered an error while analyzing your request. Please try rephrasing your question.'
      };
    }
  }

  async parseNavigationIntent(prompt: string, context: NavigationContext): Promise<NavigationCommand | null> {
    const analysis = await this.analyzeNavigationIntent(prompt, context);
    
    if (analysis.action === 'navigate' && analysis.target && analysis.confidence >= 60) {
      return {
        action: 'navigate',
        target: analysis.target,
        parameters: { response: analysis.response }
      };
    } else if (analysis.action === 'interact' && analysis.target && analysis.confidence >= 60) {
      return {
        action: 'interact',
        target: analysis.target,
        parameters: { response: analysis.response }
      };
    } else {
      return {
        action: 'info',
        target: 'general',
        parameters: { response: analysis.response }
      };
    }
  }

  async getGeneralResponse(
    prompt: string,
    contextFiles?: { name: string; content: string }[]
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API not initialized. Please provide API key.');
    }
  
    // Optional: attach file content for smoother reasoning (but no special rules)
    let contextText = '';
    if (contextFiles && contextFiles.length > 0) {
      contextText = contextFiles
        .map(file => `---\nFilename: ${file.name}\nContent:\n${file.content}\n---`)
        .join('\n\n');
    }
  
    const systemPrompt = `
  You are a helpful, natural, conversational AI assistant.
  Answer every question in a friendly, intelligent, and easy-to-understand way.
  Do NOT enforce any coding rules or special styles.
  Use context files only if relevant.
  
  Context:
  ${contextText || 'No context provided.'}
  `;
  
    try {
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: prompt }
      ]);
  
      return result.response.text().trim();
    } catch (error) {
      console.error('Error generating general response:', error);
      return 'I encountered an error while processing your request. gemini reach to limits';
    }
  }
  /** 
 * Ask Gemini to produce ONLY code for the user's request.
 * The model is instructed to return only the code block (no explanation).
 */
async getCodeOnly(prompt: string, contextFiles?: { name: string; content: string }[]): Promise<string> {
  if (!this.model) {
    throw new Error('Gemini API not initialized. Please provide API key.');
  }

  // attach context files if available (optional, helpful to include existing code)
  let contextText = '';
  if (contextFiles && contextFiles.length > 0) {
    contextText = contextFiles
      .map(file => `---\nFilename: ${file.name}\nContent:\n${file.content}\n---`)
      .join('\n\n');
  }

  const systemPrompt = `
You are a code-generation assistant. When asked, return ONLY the requested source code and nothing else
(no explanation, no commentary, no markdown, no code fences).
If you include code fences, the caller will strip them, so prefer raw code text.
If the user asked for Arduino (.ino) or servo control code, produce valid, runnable Arduino code.
Use the provided context files only as reference.
Context:
${contextText || 'No context provided'}
`;

  try {
    const result = await this.model.generateContent([
      { text: systemPrompt },
      { text: `User request (generate code only): ${prompt}` }
    ]);

    let responseText = result.response.text().trim();

    // If model returned fenced code, strip fences and language markers
    // remove ``` ``` blocks and leading/trailing whitespace
    const fencedMatch = responseText.match(/```(?:[a-zA-Z0-9_-]*\n)?([\s\S]*?)```/);
    if (fencedMatch && fencedMatch[1]) {
      responseText = fencedMatch[1].trim();
    } else {
      // also remove accidental leading "```" or "```ino" on separate lines
      responseText = responseText.replace(/^```[a-zA-Z0-9_-]*\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    return responseText;
  } catch (error) {
    console.error('Error generating code-only response:', error);
    throw error;
  }
}

  
  }
  
  