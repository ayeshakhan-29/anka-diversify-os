import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export interface ChatRequest {
  messages: ChatMessage[]
  contextType: 'global' | 'project'
  projectId?: string
  projectName?: string
}

export interface ChatResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

function generateSystemPrompt(contextType: 'global' | 'project', projectId?: string, projectName?: string): string {
  const basePrompt = `You are an AI assistant for the Anka Project Management OS. You help with development tasks, code review, documentation, and project management.

Your capabilities include:
- Writing and reviewing code (React, TypeScript, Next.js, etc.)
- Generating documentation
- Answering technical questions
- Debugging issues
- Providing best practices
- Project planning and task breakdown

Be helpful, concise, and provide practical solutions. When providing code, ensure it follows modern best practices and is properly formatted.`

  if (contextType === 'project' && projectId && projectName) {
    return `${basePrompt}

You are currently assisting with the project: "${projectName}" (ID: ${projectId}).

Project-specific context:
- Focus on this project's specific needs and requirements
- Consider the project's current phase and status
- Provide relevant suggestions based on the project domain
- Reference project-specific patterns and conventions when applicable`
  }

  return basePrompt
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | { error: string }>> {
  try {
    const body: ChatRequest = await request.json()
    
    const { messages, contextType, projectId, projectName } = body
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    // Generate system prompt based on context
    const systemPrompt = generateSystemPrompt(contextType, projectId, projectName)
    
    // Prepare messages for OpenAI
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-20).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: openaiMessages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: false
    })

    const response = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.'

    return NextResponse.json({
      content: response,
      usage: completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      } : undefined
    })

  } catch (error) {
    console.error('OpenAI API Error:', error)
    
    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes('API key')) {
        return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
      }
      if (error.message.includes('quota')) {
        return NextResponse.json({ error: 'API quota exceeded' }, { status: 429 })
      }
    }
    
    return NextResponse.json({ 
      error: 'I apologize, but I encountered an error while processing your request. Please try again later.' 
    }, { status: 500 })
  }
}
