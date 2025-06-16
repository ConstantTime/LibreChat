import { Constants } from 'librechat-data-provider';
import { useParams } from 'react-router-dom';
import { TooltipAnchor } from '~/components/ui';
import {
  formatCostDisplay,
  getCostColor,
  useConversationCost,
} from '~/data-provider/Conversations/hooks';
import { useLocalize } from '~/hooks';

export default function ConversationCost() {
  const { conversationId } = useParams();
  const localize = useLocalize();

  const { data: costData, isLoading } = useConversationCost(
    conversationId !== Constants.NEW_CONVO ? conversationId : undefined,
    {
      refetchOnWindowFocus: false,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  // Don't show anything if no cost data or still loading
  if (!costData || isLoading || conversationId === Constants.NEW_CONVO) {
    return null;
  }

  const costColor = getCostColor(costData.totalCostRaw);
  const formattedCost = formatCostDisplay(costData.totalCostRaw);

  const tooltipText = `${localize('com_ui_conversation_cost')}: ${costData.totalCost}\n${localize('com_ui_primary_model')}: ${costData.primaryModel}\n${localize('com_ui_total_tokens')}: ${costData.totalTokens.toLocaleString()}\n${localize('com_ui_last_updated')}: ${new Date(costData.lastUpdated).toLocaleString()}`;

  return (
    <TooltipAnchor
      description={tooltipText}
      render={
        <div className="flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors hover:bg-surface-hover">
          <span className="text-text-tertiary">💰</span>
          <span className={`font-medium ${costColor}`}>{formattedCost}</span>
        </div>
      }
    />
  );
}
