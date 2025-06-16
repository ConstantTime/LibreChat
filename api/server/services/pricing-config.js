/**
 * Comprehensive Pricing Configuration for LibreChat
 *
 * This file contains historical and current pricing data for all supported models.
 * Pricing is organized by effective date to handle price changes over time.
 *
 * Format:
 * - Prices are in USD per 1M tokens
 * - Each model has pricing periods with effectiveFrom dates
 * - Latest pricing should be at the top of each model's array
 *
 * Sources:
 * - OpenAI: https://openai.com/pricing
 * - Anthropic: https://www.anthropic.com/pricing
 * - Google: https://ai.google.dev/pricing
 * - And others as documented inline
 */

/**
 * @typedef {Object} PricingPeriod
 * @property {string} effectiveFrom - ISO date string when this pricing became effective
 * @property {string} [effectiveTo] - ISO date string when this pricing ended (optional, null means current)
 * @property {number} prompt - Price per 1M prompt tokens in USD
 * @property {number} completion - Price per 1M completion tokens in USD
 * @property {Object} [cache] - Cache pricing (for supported models)
 * @property {number} [cache.write] - Cache write price per 1M tokens
 * @property {number} [cache.read] - Cache read price per 1M tokens
 * @property {Object} [reasoning] - Reasoning token pricing (for o1 models)
 * @property {number} [reasoning.tokens] - Reasoning tokens price per 1M tokens
 * @property {string} [source] - Source URL for pricing information
 * @property {string} [notes] - Additional notes about this pricing period
 */

/**
 * @typedef {Object} ModelPricing
 * @property {string} modelId - Model identifier
 * @property {string} provider - Provider name (OpenAI, Anthropic, Google, etc.)
 * @property {string} category - Model category (gpt-4, claude-3, gemini, etc.)
 * @property {PricingPeriod[]} pricing - Array of pricing periods, latest first
 */

const PRICING_CONFIG = {
  // OpenAI Models
  'gpt-4o': {
    provider: 'OpenAI',
    category: 'gpt-4o',
    pricing: [
      {
        effectiveFrom: '2024-05-13T00:00:00Z',
        prompt: 5.0,
        completion: 15.0,
        source: 'https://openai.com/pricing',
        notes: 'Initial GPT-4o release pricing',
      },
    ],
  },

  'gpt-4o-mini': {
    provider: 'OpenAI',
    category: 'gpt-4o',
    pricing: [
      {
        effectiveFrom: '2024-07-18T00:00:00Z',
        prompt: 0.15,
        completion: 0.6,
        source: 'https://openai.com/pricing',
        notes: 'GPT-4o Mini launch pricing',
      },
    ],
  },

  'gpt-4': {
    provider: 'OpenAI',
    category: 'gpt-4',
    pricing: [
      {
        effectiveFrom: '2024-01-01T00:00:00Z',
        prompt: 30.0,
        completion: 60.0,
        source: 'https://openai.com/pricing',
      },
    ],
  },

  'gpt-4-turbo': {
    provider: 'OpenAI',
    category: 'gpt-4',
    pricing: [
      {
        effectiveFrom: '2024-04-09T00:00:00Z',
        prompt: 10.0,
        completion: 30.0,
        source: 'https://openai.com/pricing',
      },
    ],
  },

  'gpt-3.5-turbo': {
    provider: 'OpenAI',
    category: 'gpt-3.5',
    pricing: [
      {
        effectiveFrom: '2024-01-25T00:00:00Z',
        prompt: 0.5,
        completion: 1.5,
        source: 'https://openai.com/pricing',
      },
      {
        effectiveFrom: '2023-11-06T00:00:00Z',
        effectiveTo: '2024-01-24T23:59:59Z',
        prompt: 1.0,
        completion: 2.0,
        source: 'https://openai.com/pricing',
        notes: 'Pre-January 2024 pricing',
      },
    ],
  },

  o1: {
    provider: 'OpenAI',
    category: 'o1',
    pricing: [
      {
        effectiveFrom: '2024-12-05T00:00:00Z',
        prompt: 15.0,
        completion: 60.0,
        reasoning: {
          tokens: 15.0, // Same as prompt for now
        },
        source: 'https://openai.com/pricing',
      },
    ],
  },

  'o1-mini': {
    provider: 'OpenAI',
    category: 'o1',
    pricing: [
      {
        effectiveFrom: '2024-09-12T00:00:00Z',
        prompt: 3.0,
        completion: 12.0,
        reasoning: {
          tokens: 3.0,
        },
        source: 'https://openai.com/pricing',
      },
    ],
  },

  'o1-preview': {
    provider: 'OpenAI',
    category: 'o1',
    pricing: [
      {
        effectiveFrom: '2024-09-12T00:00:00Z',
        prompt: 15.0,
        completion: 60.0,
        reasoning: {
          tokens: 15.0,
        },
        source: 'https://openai.com/pricing',
      },
    ],
  },

  // Anthropic Models
  'claude-3-5-sonnet': {
    provider: 'Anthropic',
    category: 'claude-3.5',
    pricing: [
      {
        effectiveFrom: '2024-06-20T00:00:00Z',
        prompt: 3.0,
        completion: 15.0,
        cache: {
          write: 3.75,
          read: 0.3,
        },
        source: 'https://www.anthropic.com/pricing',
      },
    ],
  },

  'claude-3.5-sonnet': {
    provider: 'Anthropic',
    category: 'claude-3.5',
    pricing: [
      {
        effectiveFrom: '2024-06-20T00:00:00Z',
        prompt: 3.0,
        completion: 15.0,
        cache: {
          write: 3.75,
          read: 0.3,
        },
        source: 'https://www.anthropic.com/pricing',
      },
    ],
  },

  'claude-3-5-haiku': {
    provider: 'Anthropic',
    category: 'claude-3.5',
    pricing: [
      {
        effectiveFrom: '2024-11-01T00:00:00Z',
        prompt: 0.8,
        completion: 4.0,
        cache: {
          write: 1.0,
          read: 0.08,
        },
        source: 'https://www.anthropic.com/pricing',
      },
    ],
  },

  'claude-3.5-haiku': {
    provider: 'Anthropic',
    category: 'claude-3.5',
    pricing: [
      {
        effectiveFrom: '2024-11-01T00:00:00Z',
        prompt: 0.8,
        completion: 4.0,
        cache: {
          write: 1.0,
          read: 0.08,
        },
        source: 'https://www.anthropic.com/pricing',
      },
    ],
  },

  'claude-3-opus': {
    provider: 'Anthropic',
    category: 'claude-3',
    pricing: [
      {
        effectiveFrom: '2024-03-04T00:00:00Z',
        prompt: 15.0,
        completion: 75.0,
        source: 'https://www.anthropic.com/pricing',
      },
    ],
  },

  'claude-3-sonnet': {
    provider: 'Anthropic',
    category: 'claude-3',
    pricing: [
      {
        effectiveFrom: '2024-03-04T00:00:00Z',
        prompt: 3.0,
        completion: 15.0,
        source: 'https://www.anthropic.com/pricing',
      },
    ],
  },

  'claude-3-haiku': {
    provider: 'Anthropic',
    category: 'claude-3',
    pricing: [
      {
        effectiveFrom: '2024-03-04T00:00:00Z',
        prompt: 0.25,
        completion: 1.25,
        cache: {
          write: 0.3,
          read: 0.03,
        },
        source: 'https://www.anthropic.com/pricing',
      },
    ],
  },

  // Google Models
  'gemini-1.5-pro': {
    provider: 'Google',
    category: 'gemini-1.5',
    pricing: [
      {
        effectiveFrom: '2024-02-15T00:00:00Z',
        prompt: 2.5,
        completion: 10.0,
        source: 'https://ai.google.dev/pricing',
      },
    ],
  },

  'gemini-1.5-flash': {
    provider: 'Google',
    category: 'gemini-1.5',
    pricing: [
      {
        effectiveFrom: '2024-05-14T00:00:00Z',
        prompt: 0.15,
        completion: 0.6,
        source: 'https://ai.google.dev/pricing',
      },
    ],
  },

  'gemini-1.5-flash-8b': {
    provider: 'Google',
    category: 'gemini-1.5',
    pricing: [
      {
        effectiveFrom: '2024-10-03T00:00:00Z',
        prompt: 0.075,
        completion: 0.3,
        source: 'https://ai.google.dev/pricing',
      },
    ],
  },

  // Mistral Models
  'mistral-large': {
    provider: 'Mistral',
    category: 'mistral-large',
    pricing: [
      {
        effectiveFrom: '2024-01-01T00:00:00Z',
        prompt: 2.0,
        completion: 6.0,
        source: 'https://mistral.ai/technology/#pricing',
      },
    ],
  },

  'mistral-small': {
    provider: 'Mistral',
    category: 'mistral-small',
    pricing: [
      {
        effectiveFrom: '2024-01-01T00:00:00Z',
        prompt: 0.2,
        completion: 0.6,
        source: 'https://mistral.ai/technology/#pricing',
      },
    ],
  },

  // Cohere Models
  'command-r-plus': {
    provider: 'Cohere',
    category: 'command-r',
    pricing: [
      {
        effectiveFrom: '2024-04-04T00:00:00Z',
        prompt: 3.0,
        completion: 15.0,
        source: 'https://cohere.com/pricing',
      },
    ],
  },

  'command-r': {
    provider: 'Cohere',
    category: 'command-r',
    pricing: [
      {
        effectiveFrom: '2024-03-11T00:00:00Z',
        prompt: 0.5,
        completion: 1.5,
        source: 'https://cohere.com/pricing',
      },
    ],
  },
};

/**
 * Get pricing for a model at a specific date
 * @param {string} modelId - The model identifier
 * @param {Date} [date] - The date to get pricing for (defaults to now)
 * @returns {PricingPeriod|null} The pricing period effective at the given date
 */
function getPricingForDate(modelId, date = new Date()) {
  const modelConfig = PRICING_CONFIG[modelId];
  if (!modelConfig) {
    return null;
  }

  // Find the pricing period that was effective at the given date
  for (const period of modelConfig.pricing) {
    const effectiveFrom = new Date(period.effectiveFrom);
    const effectiveTo = period.effectiveTo ? new Date(period.effectiveTo) : null;

    if (date >= effectiveFrom && (!effectiveTo || date <= effectiveTo)) {
      return period;
    }
  }

  // If no exact match, return the earliest pricing as fallback
  return modelConfig.pricing[modelConfig.pricing.length - 1] || null;
}

/**
 * Calculate cost for a given model and token usage
 * @param {string} modelId - The model identifier
 * @param {Object} tokenUsage - Token usage data
 * @param {number} [tokenUsage.promptTokens] - Number of prompt tokens
 * @param {number} [tokenUsage.completionTokens] - Number of completion tokens
 * @param {number} [tokenUsage.cacheWriteTokens] - Number of cache write tokens
 * @param {number} [tokenUsage.cacheReadTokens] - Number of cache read tokens
 * @param {number} [tokenUsage.reasoningTokens] - Number of reasoning tokens
 * @param {Date} [date] - Date for pricing calculation (defaults to now)
 * @returns {Object|null} Cost breakdown or null if model not found
 */
function calculateCost(modelId, tokenUsage, date = new Date()) {
  const pricing = getPricingForDate(modelId, date);
  if (!pricing) {
    return null;
  }

  const costs = {
    prompt: 0,
    completion: 0,
    cacheWrite: 0,
    cacheRead: 0,
    reasoning: 0,
    total: 0,
  };

  // Calculate each cost component
  if (tokenUsage.promptTokens) {
    costs.prompt = (tokenUsage.promptTokens / 1000000) * pricing.prompt;
  }

  if (tokenUsage.completionTokens) {
    costs.completion = (tokenUsage.completionTokens / 1000000) * pricing.completion;
  }

  if (tokenUsage.cacheWriteTokens && pricing.cache?.write) {
    costs.cacheWrite = (tokenUsage.cacheWriteTokens / 1000000) * pricing.cache.write;
  }

  if (tokenUsage.cacheReadTokens && pricing.cache?.read) {
    costs.cacheRead = (tokenUsage.cacheReadTokens / 1000000) * pricing.cache.read;
  }

  if (tokenUsage.reasoningTokens && pricing.reasoning?.tokens) {
    costs.reasoning = (tokenUsage.reasoningTokens / 1000000) * pricing.reasoning.tokens;
  }

  // Calculate total
  costs.total =
    costs.prompt + costs.completion + costs.cacheWrite + costs.cacheRead + costs.reasoning;

  return {
    ...costs,
    modelId,
    pricing,
    date: date.toISOString(),
  };
}

/**
 * Get all supported models
 * @returns {string[]} Array of model IDs
 */
function getSupportedModels() {
  return Object.keys(PRICING_CONFIG);
}

/**
 * Get model info including provider and category
 * @param {string} modelId - The model identifier
 * @returns {Object|null} Model info or null if not found
 */
function getModelInfo(modelId) {
  const config = PRICING_CONFIG[modelId];
  if (!config) {
    return null;
  }

  return {
    modelId,
    provider: config.provider,
    category: config.category,
    supportsCaching: config.pricing.some((p) => p.cache),
    supportsReasoning: config.pricing.some((p) => p.reasoning),
  };
}

module.exports = {
  PRICING_CONFIG,
  getPricingForDate,
  calculateCost,
  getSupportedModels,
  getModelInfo,
};
