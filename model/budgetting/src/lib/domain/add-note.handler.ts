import { AddNoteToBudgetCommand } from './add-note.command';
import { AddNoteToBudgetResult } from './add-note.result';

import { Handler, HandlerContext, HandlerTools } from '@iote/cqrs';

export class AddNoteToBudgetHandler extends Handler<AddNoteToBudgetCommand>
{
  public async execute(
    command: AddNoteToBudgetCommand,
    context: HandlerContext,
    tools: HandlerTools
  ): Promise<AddNoteToBudgetResult>
  {
    // Basic validation
    if (!command.content || command.content.trim().length === 0) {
      throw new Error('Note content cannot be empty.');
    }

    // Get the repo from CQRS toolkit
    const repo = tools.getRepository('budget-notes');

    await repo.addNote({
      budgetId: command.budgetId,
      content: command.content,
      createdBy: command.createdBy,
      createdAt: command.createdAt,
    });

    return {
      success: true,
      budgetId: command.budgetId,
    };
  }
}
