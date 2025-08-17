import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { Constants } from 'librechat-data-provider';
import store from '~/store';

// Model pricing data (per 1M tokens, using average of prompt+completion)
const MODEL_PRICING: Record<string, number> = {
  // OpenAI
  'gpt-4o': 10.0,
  'gpt-4o-mini': 0.375,
  'gpt-4-turbo': 20.0,
  'gpt-4': 45.0,
  'gpt-3.5-turbo': 1.0,
  'o1': 37.5,
  'o1-mini': 7.5,
  'o1-preview': 37.5,
  
  // Anthropic
  'claude-3-5-sonnet': 9.0,
  'claude-3-5-haiku': 2.4,
  'claude-3-opus': 45.0,
  'claude-3-sonnet': 9.0,
  'claude-3-haiku': 0.75,
  'claude-2.1': 16.0,
  'claude-2': 16.0,
  
  // Google
  'gemini-1.5-pro': 6.25,
  'gemini-1.5-flash': 0.375,
  'gemini-1.5-flash-8b': 0.1875,
  'gemini-pro': 1.0,
  'gemini-2.0': 0.375,
  
  // Default
  'default': 1.0,
};

// Get base model name for pricing lookup
const getBaseModel = (model: string | null): string => {
  if (!model) return 'default';
  
  // Find the best matching model in our pricing data
  const modelLower = model.toLowerCase();
  for (const key of Object.keys(MODEL_PRICING)) {
    if (modelLower.includes(key.toLowerCase())) {
      return key;
    }
  }
  
  // Check for provider patterns
  if (modelLower.includes('gpt')) return 'gpt-3.5-turbo';
  if (modelLower.includes('claude')) return 'claude-3-haiku';
  if (modelLower.includes('gemini')) return 'gemini-1.5-flash';
  
  return 'default';
};

export default function ConversationCost() {
  const { conversationId } = useParams();
  const messages = useRecoilValue(store.messages);

  // Calculate cost in real-time from local messages
  const costData = useMemo(() => {
    if (!messages || messages.length === 0) {
      return null;
    }

    let totalCost = 0;
    let totalTokens = 0;
    const modelCosts = new Map<string, number>();

    // Process each message
    messages.forEach((message: any) => {
      // Skip messages without token count
      if (!message.tokenCount && !message.tokens && !message.usage) {
        return;
      }

      // Extract token count
      let tokenCount = 0;
      if (message.tokenCount) {
        tokenCount = message.tokenCount;
      } else if (message.usage) {
        tokenCount = (message.usage.prompt_tokens || 0) + (message.usage.completion_tokens || 0);
      } else if (message.tokens) {
        tokenCount = (message.tokens.prompt || 0) + (message.tokens.completion || 0);
      }

      if (tokenCount === 0) return;

      totalTokens += tokenCount;

      // Calculate cost for this message
      const model = message.model || 'default';
      const baseModel = getBaseModel(model);
      const pricePerMillion = MODEL_PRICING[baseModel] || MODEL_PRICING.default;
      const messageCost = (tokenCount / 1_000_000) * pricePerMillion;

      totalCost += messageCost;

      // Track per-model costs
      const currentModelCost = modelCosts.get(model) || 0;
      modelCosts.set(model, currentModelCost + messageCost);
    });

    // Find primary model (most expensive)
    let primaryModel = 'Unknown';
    let maxCost = 0;
    modelCosts.forEach((cost, model) => {
      if (cost > maxCost) {
        maxCost = cost;
        primaryModel = model;
      }
    });

    // Format cost for display
    const formatCost = (cost: number) => {
      if (cost < 0.001) return '<$0.001';
      if (cost < 0.01) return `$${cost.toFixed(4)}`;
      if (cost < 1) return `$${cost.toFixed(3)}`;
      return `$${cost.toFixed(2)}`;
    };

    return {
      totalCost: formatCost(totalCost),
      totalCostRaw: totalCost,
      primaryModel,
      totalTokens,
      lastUpdated: new Date(),
    };
  }, [messages]);

  // Helper function to get color class based on cost
  const getCostColorClass = (cost: number) => {
    if (cost < 0.01) return 'text-green-600 dark:text-green-400';
    if (cost < 0.1) return 'text-yellow-600 dark:text-yellow-400';
    if (cost < 1) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Don't show for new conversations
  if (!conversationId || conversationId === Constants.NEW_CONVO) {
    return null;
  }

  // Show placeholder while loading
  if (!costData) {
    return (
      <div className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400">
        <span>💰</span>
        <span>$0.00</span>
      </div>
    );
  }

  const tooltipText = `Cost: ${costData.totalCost} | Model: ${costData.primaryModel} | Tokens: ${costData.totalTokens.toLocaleString()} | Updated: ${new Date(costData.lastUpdated).toLocaleTimeString()}`;

  return (
    <div
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors hover:bg-surface-hover"
      title={tooltipText}
    >
      <span className="text-text-tertiary">💰</span>
      <span className={`font-medium ${getCostColorClass(costData.totalCostRaw)}`}>
        {costData.totalCost}
      </span>
    </div>
  );
}