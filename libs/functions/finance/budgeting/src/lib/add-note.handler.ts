import { HandlerTools } from '@iote/cqrs';
import { FunctionHandler, FunctionContext } from '@ngfi/functions';

import { BudgetNote } from '@app/budget-notes';
import { AddNoteToBudgetCommand } from '@app/budget-notes';
import { AddNoteToBudgetResult } from '@app/budget-notes';

/** Firestore path for budget notes, scoped to the active org and budget. */
const BUDGET_NOTES_REPO = (orgId: string, budgetId: string) =>
  `orgs/${orgId}/budgets/${budgetId}/notes`;

/**
 * Handles the AddNoteToBudgetCommand.
 * Validates the note content, then persists a new BudgetNote document
 * to Firestore using the CQRS toolkit repository.
 */
export class AddNoteToBudgetHandler extends FunctionHandler<AddNoteToBudgetCommand, AddNoteToBudgetResult>
{
  public async execute(
    command: AddNoteToBudgetCommand,
    _context: FunctionContext,
    tools: HandlerTools
  ): Promise<AddNoteToBudgetResult>
  {
    tools.Logger.log(() => `[AddNoteToBudgetHandler].execute: Adding note to budget ${command.budgetId} for org ${command.orgId}`);

    // Basic validation
    if (!command.content || command.content.trim().length === 0) {
      throw new Error('Note content cannot be empty.');
    }

    // Get the scoped repository for this org's budget notes
    const notesRepo = tools.getRepository<BudgetNote>(
      BUDGET_NOTES_REPO(command.orgId, command.budgetId)
    );

    // Persist the note as a new Firestore document
    const note: Omit<BudgetNote, 'id'> = {
      budgetId: command.budgetId,
      content:  command.content.trim(),
      createdBy: command.createdBy,
      createdAt: command.createdAt,
    };

    await notesRepo.create(note as BudgetNote);

    tools.Logger.log(() => `[AddNoteToBudgetHandler].execute: Note successfully added to budget ${command.budgetId}`);

    return {
      success: true,
      budgetId: command.budgetId,
    };
  }
}
