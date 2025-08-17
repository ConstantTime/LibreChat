const {
  calculateConversationCostFromMessages,
  getConversationCostDisplayFromMessages,
  getMultipleConversationCosts,
} = require('../ConversationCostDynamic');

// Mock console to avoid output during tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('ConversationCostDynamic Service', () => {
  describe('calculateConversationCostFromMessages', () => {
    it('should return null for empty messages array', () => {
      const result = calculateConversationCostFromMessages([]);
      expect(result).toBeNull();
    });

    it('should return null for null messages', () => {
      const result = calculateConversationCostFromMessages(null);
      expect(result).toBeNull();
    });

    it('should calculate cost for single assistant message', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-4o',
          tokenCount: 1000,
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toBeCloseTo(0.015); // 1000 completion tokens * 15.0/1M
      expect(result.tokenUsage.completionTokens).toBe(1000);
      expect(result.modelBreakdown).toHaveLength(1);
      expect(result.modelBreakdown[0].model).toBe('gpt-4o');
    });

    it('should calculate cost for user and assistant messages', () => {
      const messages = [
        {
          messageId: '1',
          model: null, // User message
          tokenCount: 500,
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '2',
          model: 'gpt-4o',
          tokenCount: 1000,
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toBeCloseTo(0.015); // Only assistant message costs
      expect(result.tokenUsage.promptTokens).toBe(500);
      expect(result.tokenUsage.completionTokens).toBe(1000);
      expect(result.modelBreakdown).toHaveLength(2);
    });

    it('should handle messages with OpenAI usage format', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-4',
          usage: {
            prompt_tokens: 500,
            completion_tokens: 1000,
          },
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toBeCloseTo(0.075); // 500*30/1M + 1000*60/1M
      expect(result.tokenUsage.promptTokens).toBe(500);
      expect(result.tokenUsage.completionTokens).toBe(1000);
    });

    it('should handle messages with alternative tokens format', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-3.5-turbo',
          tokens: {
            prompt: 300,
            completion: 700,
          },
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toBeCloseTo(0.00115); // 300*0.5/1M + 700*1.5/1M
      expect(result.tokenUsage.promptTokens).toBe(300);
      expect(result.tokenUsage.completionTokens).toBe(700);
    });

    it('should calculate costs for multiple models in conversation', () => {
      const messages = [
        {
          messageId: '1',
          model: null,
          tokenCount: 100,
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '2',
          model: 'gpt-4',
          tokenCount: 500,
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '3',
          model: null,
          tokenCount: 150,
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '4',
          model: 'claude-3-opus',
          tokenCount: 600,
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '5',
          model: null,
          tokenCount: 200,
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '6',
          model: 'gemini-1.5-pro',
          tokenCount: 800,
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.modelBreakdown).toHaveLength(4); // user-input + 3 models
      expect(result.tokenUsage.promptTokens).toBe(450); // 100 + 150 + 200
      expect(result.tokenUsage.completionTokens).toBe(1900); // 500 + 600 + 800

      // Check individual model costs
      const gpt4Model = result.modelBreakdown.find((m) => m.model === 'gpt-4');
      expect(gpt4Model.cost).toBeCloseTo(0.03); // 500 * 60 / 1M

      const claudeModel = result.modelBreakdown.find((m) => m.model === 'claude-3-opus');
      expect(claudeModel.cost).toBeCloseTo(0.045); // 600 * 75 / 1M

      const geminiModel = result.modelBreakdown.find((m) => m.model === 'gemini-1.5-pro');
      expect(geminiModel.cost).toBeCloseTo(0.008); // 800 * 10 / 1M
    });

    it('should handle cache tokens for Claude models', () => {
      const messages = [
        {
          messageId: '1',
          model: 'claude-3-5-sonnet',
          tokenCount: 1000,
          cacheTokens: {
            write: 500,
            read: 300,
          },
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.costBreakdown.completion).toBeCloseTo(0.015); // 1000 * 15 / 1M
      expect(result.costBreakdown.cacheWrite).toBeCloseTo(0.001875); // 500 * 3.75 / 1M
      expect(result.costBreakdown.cacheRead).toBeCloseTo(0.00009); // 300 * 0.3 / 1M
      expect(result.tokenUsage.cacheWriteTokens).toBe(500);
      expect(result.tokenUsage.cacheReadTokens).toBe(300);
    });

    it('should handle reasoning tokens for o1 models', () => {
      const messages = [
        {
          messageId: '1',
          model: 'o1',
          usage: {
            prompt_tokens: 500,
            completion_tokens: 1000,
            reasoning_tokens: 2000,
          },
          createdAt: new Date('2024-12-10'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.costBreakdown.prompt).toBeCloseTo(0.0075); // 500 * 15 / 1M
      expect(result.costBreakdown.completion).toBeCloseTo(0.06); // 1000 * 60 / 1M
      expect(result.costBreakdown.reasoning).toBeCloseTo(0.03); // 2000 * 15 / 1M
      expect(result.tokenUsage.reasoningTokens).toBe(2000);
    });

    it('should use historical pricing based on message date', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-3.5-turbo',
          tokenCount: 1000,
          createdAt: new Date('2023-11-10'), // Historical pricing period
        },
        {
          messageId: '2',
          model: 'gpt-3.5-turbo',
          tokenCount: 1000,
          createdAt: new Date('2024-06-01'), // Current pricing period
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      // First message: 1000 * 2.0 / 1M = 0.002 (historical completion price)
      // Second message: 1000 * 1.5 / 1M = 0.0015 (current completion price)
      expect(result.totalCost).toBeCloseTo(0.0035);
    });

    it('should skip messages without token information', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-4',
          // No tokenCount, usage, or tokens
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '2',
          model: 'gpt-4',
          tokenCount: 1000,
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toBeCloseTo(0.06); // Only second message counted
      expect(result.modelBreakdown[0].messageCount).toBe(1);
    });

    it('should handle model not in pricing database', () => {
      const messages = [
        {
          messageId: '1',
          model: 'unknown-model-xyz',
          tokenCount: 1000,
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toBe(0); // No cost for unknown model
      expect(result.tokenUsage.completionTokens).toBe(1000); // Tokens still counted
    });

    it('should track lastUpdated timestamp correctly', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-4',
          tokenCount: 500,
          createdAt: new Date('2024-06-01T10:00:00Z'),
        },
        {
          messageId: '2',
          model: 'gpt-4',
          tokenCount: 500,
          createdAt: new Date('2024-06-01T15:00:00Z'),
        },
        {
          messageId: '3',
          model: 'gpt-4',
          tokenCount: 500,
          createdAt: new Date('2024-06-01T12:00:00Z'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.lastUpdated).toEqual(new Date('2024-06-01T15:00:00Z'));
    });
  });

  describe('getConversationCostDisplayFromMessages', () => {
    it('should return null for empty messages', () => {
      const result = getConversationCostDisplayFromMessages([]);
      expect(result).toBeNull();
    });

    it('should format costs less than $0.001', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-4o-mini',
          tokenCount: 100, // Very small amount
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = getConversationCostDisplayFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toBe('<$0.001');
      expect(result.totalCostRaw).toBeCloseTo(0.00006);
    });

    it('should format costs between $0.001 and $0.01', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-3.5-turbo',
          tokenCount: 2000,
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = getConversationCostDisplayFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toMatch(/^\$0\.\d{4}$/); // Format: $0.0030
    });

    it('should format costs between $0.01 and $1', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-4',
          tokenCount: 1000,
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = getConversationCostDisplayFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toMatch(/^\$0\.\d{3}$/); // Format: $0.060
    });

    it('should format costs over $1', () => {
      const messages = [
        {
          messageId: '1',
          model: 'claude-3-opus',
          tokenCount: 20000,
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = getConversationCostDisplayFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toMatch(/^\$\d+\.\d{2}$/); // Format: $1.50
    });

    it('should identify primary model correctly', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-3.5-turbo',
          tokenCount: 100,
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '2',
          model: 'gpt-4',
          tokenCount: 1000, // This will cost more
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = getConversationCostDisplayFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.primaryModel).toBe('gpt-4'); // Higher cost model
    });

    it('should calculate total tokens correctly', () => {
      const messages = [
        {
          messageId: '1',
          model: null,
          tokenCount: 500, // User message (prompt)
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '2',
          model: 'gpt-4',
          tokenCount: 1000, // Assistant message (completion)
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = getConversationCostDisplayFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalTokens).toBe(1500);
    });
  });

  // Note: getMultipleConversationCosts tests removed as they require database access
  // These would be better suited as integration tests

  describe('Edge Cases', () => {
    it('should handle messages with mixed token formats', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-4',
          tokenCount: 500,
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '2',
          model: 'claude-3-opus',
          usage: {
            prompt_tokens: 300,
            completion_tokens: 700,
          },
          createdAt: new Date('2024-06-01'),
        },
        {
          messageId: '3',
          model: 'gemini-1.5-pro',
          tokens: {
            input: 200,
            output: 400,
          },
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.tokenUsage.promptTokens).toBe(500); // 300 + 200
      expect(result.tokenUsage.completionTokens).toBe(1600); // 500 + 700 + 400
    });

    it('should handle messages with partial token information', () => {
      const messages = [
        {
          messageId: '1',
          model: 'o1',
          usage: {
            prompt_tokens: 500,
            // Missing completion_tokens
            reasoning_tokens: 1000,
          },
          createdAt: new Date('2024-12-10'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.tokenUsage.promptTokens).toBe(500);
      expect(result.tokenUsage.completionTokens).toBe(0);
      expect(result.tokenUsage.reasoningTokens).toBe(1000);
    });

    it('should handle very large token counts', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-4',
          tokenCount: 128000, // Max context size
          createdAt: new Date('2024-06-01'),
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toBeCloseTo(7.68); // 128000 * 60 / 1M
    });

    it('should handle messages without createdAt timestamp', () => {
      const messages = [
        {
          messageId: '1',
          model: 'gpt-4',
          tokenCount: 1000,
          // No createdAt
        },
      ];

      const result = calculateConversationCostFromMessages(messages);

      expect(result).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.lastUpdated).toBeDefined();
    });
  });
});
