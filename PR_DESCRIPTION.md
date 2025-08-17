## Summary

Adds real-time cost tracking for conversations. Users can now see how much their conversations cost as messages stream, with automatic updates and color-coded indicators.

## Features

- **Dynamic cost calculation** from message history
- **100+ model support** across OpenAI, Anthropic, Google, and AWS Bedrock  
- **Historical pricing** ensures accurate costs based on when messages were sent
- **Color-coded display** for quick cost assessment:
  - 🟢 Green: < $0.01
  - 🟡 Yellow: < $0.10
  - 🟠 Orange: < $1.00
  - 🔴 Red: > $1.00

## Implementation

The cost display appears in the conversation header and updates automatically as new messages arrive. Hover over the cost to see detailed breakdown including model used, token count, and last update time.

## Testing

- 56 unit tests covering all pricing logic and edge cases
- Tested with multiple models in single conversations
- Verified historical pricing calculations

## Change Type

- [x] New feature (non-breaking change which adds functionality)

## Checklist

- [x] My code adheres to this project's style guidelines
- [x] I have performed a self-review of my own code
- [x] I have commented in any complex areas of my code
- [x] My changes do not introduce new warnings
- [x] Local unit tests pass with my changes (56 tests)
- [x] I have written tests demonstrating that my changes are effective