const { logger } = require('~/config');
const { calculateCost, getModelInfo } = require('./pricing-config');
const { Transaction } = require('~/db/models');

/**
 * @typedef {Object} ConversationCostSummary
 * @property {string} conversationId - The conversation ID
 * @property {number} totalCost - Total cost in USD
 * @property {Object} costBreakdown - Breakdown by cost type
 * @property {number} costBreakdown.prompt - Prompt token costs
 * @property {number} costBreakdown.completion - Completion token costs
 * @property {number} costBreakdown.cacheWrite - Cache write costs
 * @property {number} costBreakdown.cacheRead - Cache read costs
 * @property {number} costBreakdown.reasoning - Reasoning token costs
 * @property {Object} tokenUsage - Token usage summary
 * @property {number} tokenUsage.promptTokens - Total prompt tokens
 * @property {number} tokenUsage.completionTokens - Total completion tokens
 * @property {number} tokenUsage.cacheWriteTokens - Total cache write tokens
 * @property {number} tokenUsage.cacheReadTokens - Total cache read tokens
 * @property {number} tokenUsage.reasoningTokens - Total reasoning tokens
 * @property {Array} modelBreakdown - Cost breakdown by model
 * @property {Date} lastUpdated - Last update timestamp
 */

/**
 * Calculate the total cost of a conversation using historical pricing data
 * @param {string} conversationId - The conversation ID
 * @param {string} [userId] - Optional user ID for additional filtering
 * @returns {Promise<ConversationCostSummary|null>} Cost summary or null if no transactions found
 */
async function calculateConversationCost(conversationId, userId = null) {
  try {
    // Build query filters
    const query = { conversationId };
    if (userId) {
      query.user = userId;
    }

    // Get all transactions for this conversation
    const transactions = await Transaction.find(query)
      .sort({ createdAt: 1 })
      .lean();

    if (!transactions || transactions.length === 0) {
      return null;
    }

    // Initialize cost tracking
    const costBreakdown = {
      prompt: 0,
      completion: 0,
      cacheWrite: 0,
      cacheRead: 0,
      reasoning: 0,
    };

    const tokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      cacheWriteTokens: 0,
      cacheReadTokens: 0,
      reasoningTokens: 0,
    };

    const modelBreakdown = new Map();
    let lastUpdated = new Date(0);

    // Process each transaction
    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.createdAt);
      if (transactionDate > lastUpdated) {
        lastUpdated = transactionDate;
      }

      const modelId = transaction.model;
      if (!modelId) {
        logger.warn(`Transaction ${transaction._id} has no model specified`);
        continue;
      }

      // Initialize model breakdown if not exists
      if (!modelBreakdown.has(modelId)) {
        modelBreakdown.set(modelId, {
          modelId,
          cost: 0,
          tokenUsage: {
            promptTokens: 0,
            completionTokens: 0,
            cacheWriteTokens: 0,
            cacheReadTokens: 0,
            reasoningTokens: 0,
          },
          transactionCount: 0,
        });
      }

      const modelData = modelBreakdown.get(modelId);
      modelData.transactionCount++;

      // Calculate token counts based on transaction type and structure
      let currentTokenUsage = {};

      if (transaction.tokenType === 'prompt') {
        if (transaction.inputTokens !== undefined) {
          // Structured prompt transaction
          currentTokenUsage.promptTokens = Math.abs(transaction.inputTokens || 0);
          currentTokenUsage.cacheWriteTokens = Math.abs(transaction.writeTokens || 0);
          currentTokenUsage.cacheReadTokens = Math.abs(transaction.readTokens || 0);
        } else {
          // Regular prompt transaction
          currentTokenUsage.promptTokens = Math.abs(transaction.rawAmount || 0);
        }
      } else if (transaction.tokenType === 'completion') {
        currentTokenUsage.completionTokens = Math.abs(transaction.rawAmount || 0);
      } else if (transaction.tokenType === 'reasoning') {
        currentTokenUsage.reasoningTokens = Math.abs(transaction.rawAmount || 0);
      }

      // Calculate cost using historical pricing for this transaction's date
      const cost = calculateCost(modelId, currentTokenUsage, transactionDate);

      if (cost) {
        // Add to overall breakdown
        costBreakdown.prompt += cost.prompt;
        costBreakdown.completion += cost.completion;
        costBreakdown.cacheWrite += cost.cacheWrite;
        costBreakdown.cacheRead += cost.cacheRead;
        costBreakdown.reasoning += cost.reasoning;

        // Add to model breakdown
        modelData.cost += cost.total;
        modelData.tokenUsage.promptTokens += currentTokenUsage.promptTokens || 0;
        modelData.tokenUsage.completionTokens += currentTokenUsage.completionTokens || 0;
        modelData.tokenUsage.cacheWriteTokens += currentTokenUsage.cacheWriteTokens || 0;
        modelData.tokenUsage.cacheReadTokens += currentTokenUsage.cacheReadTokens || 0;
        modelData.tokenUsage.reasoningTokens += currentTokenUsage.reasoningTokens || 0;
      } else {
        logger.warn(`Could not calculate cost for model ${modelId} at date ${transactionDate}`);
        // Fallback to using the stored tokenValue from the transaction
        const fallbackCost = Math.abs(transaction.tokenValue || 0) / 1000000; // Convert from credits to USD
        costBreakdown[transaction.tokenType === 'completion' ? 'completion' : 'prompt'] += fallbackCost;
        modelData.cost += fallbackCost;
      }

      // Add to total token usage
      tokenUsage.promptTokens += currentTokenUsage.promptTokens || 0;
      tokenUsage.completionTokens += currentTokenUsage.completionTokens || 0;
      tokenUsage.cacheWriteTokens += currentTokenUsage.cacheWriteTokens || 0;
      tokenUsage.cacheReadTokens += currentTokenUsage.cacheReadTokens || 0;
      tokenUsage.reasoningTokens += currentTokenUsage.reasoningTokens || 0;
    }

    // Calculate total cost
    const totalCost = costBreakdown.prompt + costBreakdown.completion + costBreakdown.cacheWrite + costBreakdown.cacheRead + costBreakdown.reasoning;

    // Convert model breakdown to array and add model info
    const modelBreakdownArray = Array.from(modelBreakdown.values())
      .map((model) => {
        const modelInfo = getModelInfo(model.modelId);
        return {
          ...model,
          provider: modelInfo?.provider || 'Unknown',
          category: modelInfo?.category || 'Unknown',
        };
      })
      .sort((a, b) => b.cost - a.cost); // Sort by cost descending

    return {
      conversationId,
      totalCost: Math.round(totalCost * 100000) / 100000, // Round to 5 decimal places
      costBreakdown: {
        prompt: Math.round(costBreakdown.prompt * 100000) / 100000,
        completion: Math.round(costBreakdown.completion * 100000) / 100000,
        cacheWrite: Math.round(costBreakdown.cacheWrite * 100000) / 100000,
        cacheRead: Math.round(costBreakdown.cacheRead * 100000) / 100000,
        reasoning: Math.round(costBreakdown.reasoning * 100000) / 100000,
      },
      tokenUsage,
      modelBreakdown: modelBreakdownArray,
      lastUpdated,
    };
  } catch (error) {
    logger.error('Error calculating conversation cost:', error);
    throw error;
  }
}

/**
 * Get a simplified cost display for UI
 * @param {string} conversationId - The conversation ID
 * @param {string} [userId] - Optional user ID
 * @returns {Promise<Object|null>} Simplified cost data for UI display
 */
async function getConversationCostDisplay(conversationId, userId = null) {
  try {
    const costSummary = await calculateConversationCost(conversationId, userId);
    if (!costSummary) {
      return null;
    }

    // Format cost for display
    const formatCost = (cost) => {
      if (cost < 0.001) {
        return '<$0.001';
      }
      if (cost < 0.01) {
        return `$${cost.toFixed(4)}`;
      }
      if (cost < 1) {
        return `$${cost.toFixed(3)}`;
      }
      return `$${cost.toFixed(2)}`;
    };

    return {
      conversationId,
      totalCost: formatCost(costSummary.totalCost),
      totalCostRaw: costSummary.totalCost,
      primaryModel: costSummary.modelBreakdown[0]?.modelId || 'Unknown',
      totalTokens: costSummary.tokenUsage.promptTokens + costSummary.tokenUsage.completionTokens,
      lastUpdated: costSummary.lastUpdated,
    };
  } catch (error) {
    logger.error('Error getting conversation cost display:', error);
    return null;
  }
}

/**
 * Calculate costs for multiple conversations
 * @param {string[]} conversationIds - Array of conversation IDs
 * @param {string} [userId] - Optional user ID
 * @returns {Promise<Object>} Map of conversation IDs to cost displays
 */
async function getMultipleConversationCosts(conversationIds, userId = null) {
  try {
    const results = {};
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < conversationIds.length; i += batchSize) {
      const batch = conversationIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (conversationId) => {
        try {
          const cost = await getConversationCostDisplay(conversationId, userId);
          return { conversationId, cost };
        } catch (error) {
          logger.error(`Error calculating cost for conversation ${conversationId}:`, error);
          return { conversationId, cost: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ conversationId, cost }) => {
        results[conversationId] = cost;
      });
    }

    return results;
  } catch (error) {
    logger.error('Error calculating multiple conversation costs:', error);
    throw error;
  }
}

module.exports = {
  calculateConversationCost,
  getConversationCostDisplay,
  getMultipleConversationCosts,
}; 