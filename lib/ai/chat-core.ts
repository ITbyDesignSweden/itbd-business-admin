import { google } from '@ai-sdk/google';
import { 
  convertToModelMessages, 
  UIMessage, 
  createUIMessageStream, 
  createUIMessageStreamResponse,
  ToolLoopAgent,
  createAgentUIStream,
  stepCountIs
} from 'ai';

export type CustomUIMessage = UIMessage<
  {
    modelId?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  },
  {
    notification: {
      message: string;
      level: 'info' | 'success' | 'warning' | 'error';
    };
  }
>;

interface ProcessAiChatParams {
  messages: UIMessage[];
  systemPrompt: string;
  tools?: Record<string, any>;
  connectionNotificationText?: string;
  attachments?: Array<{ name: string; url: string; contentType: string }>;
  corsHeaders: Record<string, string>;
}

/**
 * Shared Core AI Chat Logic
 * Handles attachments, agent setup, tool execution, and streaming
 */
export async function processAiChatStream({
  messages,
  systemPrompt,
  tools = {},
  connectionNotificationText,
  attachments = [],
  corsHeaders
}: ProcessAiChatParams) {
  
  // 1. Process attachments for multimodal input
  let processedMessages: any[] = messages;
  if (attachments && attachments.length > 0) {
    processedMessages = [...messages];
    const lastMessageIndex = processedMessages.length - 1;
    const lastMessage = processedMessages[lastMessageIndex];
    
    const imageParts = await Promise.all(
      attachments
        .filter(att => att.contentType.startsWith('image/'))
        .map(async (att) => {
          try {
            const response = await fetch(att.url);
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            
            return {
              type: 'image' as const,
              image: `data:${att.contentType};base64,${base64}`,
            };
          } catch (error) {
            console.error('Failed to fetch attachment:', att.name, error);
            return null;
          }
        })
    );
    
    const validImageParts = imageParts.filter(p => p !== null);
    
    if (validImageParts.length > 0) {
      const textContent = typeof lastMessage.content === 'string' 
        ? lastMessage.content 
        : lastMessage.parts?.find((p: any) => p.type === 'text')?.text || '';
      
      processedMessages[lastMessageIndex] = {
        ...lastMessage,
        content: [
          { type: 'text' as const, text: textContent },
          ...validImageParts,
        ],
      };
    }
  }

  // 2. Prepare AI model and stream
  const model = google('gemini-3-flash-preview');

  const stream = createUIMessageStream<CustomUIMessage>({
    execute: async ({ writer }) => {
      // Connection notification
      writer.write({
        type: 'data-notification',
        data: { 
          message: connectionNotificationText || 'Ansluter till ITBD AI...', 
          level: 'info' 
        },
        transient: true,
      });

      // Initialize Agent with tools
      const agent = new ToolLoopAgent({
        model,
        instructions: systemPrompt,
        tools: tools || {},
        stopWhen: stepCountIs(5),
        onFinish: (result) => {
          const totalUsage = result.steps.reduce((acc, step) => ({
            inputTokens: acc.inputTokens + (step.usage?.inputTokens ?? 0),
            outputTokens: acc.outputTokens + (step.usage?.outputTokens ?? 0),
          }), { inputTokens: 0, outputTokens: 0 });

          writer.write({
            type: 'message-metadata',
            messageMetadata: {
              modelId: result.response.modelId,
              usage: {
                promptTokens: totalUsage.inputTokens,
                completionTokens: totalUsage.outputTokens,
                totalTokens: totalUsage.inputTokens + totalUsage.outputTokens,
              },
            },
          });

          writer.write({
            type: 'data-notification',
            data: { 
              message: 'Svar genererat', 
              level: 'success' 
            },
            transient: true,
          });
        }
      });

      try {
        const agentStream = await createAgentUIStream({
          agent: agent as any,
          uiMessages: processedMessages,
        });
        await writer.merge(agentStream as any);
      } catch (e) {
        console.error('Error in agent UI stream:', e);
      }
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: corsHeaders,
  });
}

