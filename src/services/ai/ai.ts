import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  Configuration,
  OpenAIApi,
} from 'openai';

import { MODEL, DEFAULT_TOP_LEVEL_DOMAINS, PROMPTS } from './consts';
import { isDomainInvalid } from './utils';
import AiError from './AiError';

let chatHistory: ChatCompletionRequestMessage[];

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPEN_AI_API_KEY,
  })
);
const chat = async (message: string): Promise<ChatCompletionResponseMessage | undefined> => {
  chatHistory.push({ role: 'user', content: message });
  const res = await openai.createChatCompletion({
    model: MODEL,
    messages: [...chatHistory],
  });
  return res.data.choices[0].message;
};

export const getDomains = async ({
  desc,
  prompt = 'default',
  tlds = DEFAULT_TOP_LEVEL_DOMAINS,
  pageSize = 10,
}: {
  desc: string;
  prompt?: keyof typeof PROMPTS;
  tlds?: string[];
  pageSize?: number;
}): Promise<string[]> => {
  const message = PROMPTS[prompt]
    .replace('{desc}', desc)
    .replace('{tlds}', tlds.join(', '))
    .replace('{pageSize}', String(pageSize));
  chatHistory = [];
  const response = await chat(message);
  if(response?.role === 'assistant'){
    chatHistory.push({role: 'assistant', content: response?.content});
  }
  if (!response?.content) {
    throw new AiError('Prompt is invalid');
  }

  const domains = response.content.split('\n').map(domain => {
    return domain.split('. ')[1];
  });

  if (domains?.some(isDomainInvalid)) {
    throw new AiError('Prompt is invalid');
  }

  return domains;

};

export const loadMoreDomains = async (
  prompt:keyof typeof PROMPTS = 'generate-more'): Promise<string[]> => {
  const message = PROMPTS[prompt];
  const response = await chat(message);
  if(response?.role === 'assistant'){
    chatHistory.push({role: 'assistant', content: response?.content});
  }

  if (!response?.content) {
    throw new AiError('Prompt is invalid');
  }

  const domains = response.content.split('\n').map(domain => {
    return domain.split('. ')[1];
  });

  if (domains?.some(isDomainInvalid)) {
    throw new AiError('Prompt is invalid');
  }

  return domains;

};

