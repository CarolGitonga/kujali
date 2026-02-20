export class AddNoteToBudgetCommand
{
  constructor(
    public readonly orgId: string,
    public readonly budgetId: string,
    public readonly content: string,
    public readonly createdBy: string,
    public readonly createdAt: number = Date.now()
  ) {}
}
