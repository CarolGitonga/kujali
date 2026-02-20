import { IObject } from '@iote/bricks';

/**
 * Represents a note attached to a budget.
 * Stored at: orgs/{orgId}/budgets/{budgetId}/notes/{noteId}
 */
export interface BudgetNote extends IObject
{
  budgetId: string;
  content: string;
  createdBy: string;
  createdAt: number;
}
