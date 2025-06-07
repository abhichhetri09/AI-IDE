export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function getChatCompletion(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
  } = {},
) {
  const { model = "codellama", temperature = 0.7 } = options;

  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.message.content,
      role: "assistant" as const,
    };
  } catch (error) {
    console.error("Ollama API Error:", error);
    throw error;
  }
}

export async function getCodeCompletion(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
  } = {},
) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "You are an expert programmer. Provide code completions and suggestions.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  return getChatCompletion(messages, options);
}

export async function getCodeExplanation(
  code: string,
  options: {
    model?: string;
    temperature?: number;
  } = {},
) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "Explain the following code in a clear and concise way.",
    },
    {
      role: "user",
      content: code,
    },
  ];

  return getChatCompletion(messages, {
    ...options,
    temperature: 0.3, // Lower temperature for more focused explanations
  });
}
