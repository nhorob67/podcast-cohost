import OpenAI from 'openai';

export class GPT4Adapter {
  constructor(apiKey) {
    this.client = new OpenAI({ apiKey });
  }

  async streamCompletion(messages, onToken, onComplete, onError) {
    try {
      const stream = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        stream: true,
        max_tokens: 200,
        temperature: 0.3,
      });

      let fullResponse = '';
      let firstToken = true;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          if (firstToken) {
            firstToken = false;
            onToken(content, true);
          } else {
            onToken(content, false);
          }
          fullResponse += content;
        }
      }

      onComplete(fullResponse);
    } catch (error) {
      console.error('LLM streaming error:', error);
      onError(error);
    }
  }
}
