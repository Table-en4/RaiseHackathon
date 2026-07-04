type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const LLM_TIMEOUT_MS = 3000;

export async function callLlm(messages: ChatMessage[]): Promise<string> {
  const useExternal = process.env.USE_EXTERNAL_LLM === "true";
  const externalKey = process.env.OPENAI_API_KEY;

  if (useExternal && externalKey) {
    return callOpenAi(messages, externalKey);
  }

  const llmUrl = process.env.LLM_URL ?? "http://localhost:11434";
  const model = process.env.LLM_MODEL ?? "llama3.2";

  try {
    return await callOllama(llmUrl, model, messages);
  } catch (error) {
    if (externalKey) {
      return callOpenAi(messages, externalKey);
    }
    throw error;
  }
}

async function callOllama(baseUrl: string, model: string, messages: ChatMessage[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        format: "json",
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = (await response.json()) as { message?: { content?: string } };
    const content = data.message?.content;
    if (!content) throw new Error("Empty Ollama response");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAi(messages: ChatMessage[], apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty OpenAI response");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkLlmHealth(): Promise<boolean> {
  const llmUrl = process.env.LLM_URL;
  if (!llmUrl) return process.env.USE_EXTERNAL_LLM === "true" && !!process.env.OPENAI_API_KEY;

  try {
    const response = await fetch(`${llmUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}
