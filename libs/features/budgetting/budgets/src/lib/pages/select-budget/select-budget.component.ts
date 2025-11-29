
import { Component, inject, computed, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { cloneDeep as ___cloneDeep, flatMap as __flatMap } from 'lodash';
import { toSignal } from '@angular/core/rxjs-interop';

import { Logger } from '@iote/bricks-angular';

import {
  Budget,
  BudgetRecord,
  BudgetStatus,
  OrgBudgetsOverview
} from '@app/model/finance/planning/budgets';

import {
  BudgetsStore,
  OrgBudgetsStore
} from '@app/state/finance/budgetting/budgets';

import { CreateBudgetModalComponent } from '../../components/create-budget-modal/create-budget-modal.component';

@Component({
  selector: 'app-select-budget',
  templateUrl: './select-budget.component.html',
  styleUrls: [
    './select-budget.component.scss',
    '../../components/budget-view-styles.scss'
  ],
})
/** List of all active budgets on the system — Signals Refactor Version */
export class SelectBudgetPageComponent
{
  // -------------------------------------------
  // 1. Replace constructor DI → inject()
  // -------------------------------------------
  private _orgBudgets$$ = inject(OrgBudgetsStore);
  private _budgets$$ = inject(BudgetsStore);
  private _dialog = inject(MatDialog);
  private _logger = inject(Logger);

  showFilter = false;

  // -------------------------------------------
  // 2. Convert Observables → Signals
  // -------------------------------------------
  overview = toSignal(
    this._orgBudgets$$.get(),
    { initialValue: {} as OrgBudgetsOverview }
  );

  sharedBudgets = toSignal(
    this._budgets$$.get(),
    { initialValue: [] }
  );

  // Raw flattened signals used to compute allBudgets
  private overviewRaw = toSignal(this._orgBudgets$$.get(), { initialValue: [] });
  private budgetsRaw  = toSignal(this._budgets$$.get(),    { initialValue: [] });

  // -------------------------------------------
  // 3. computed(): merge + transform overview + budgets
  // -------------------------------------------
  allBudgets = computed(() => {
    const overview = __flatMap(this.overviewRaw());
    const budgets  = __flatMap(this.budgetsRaw());

    const transformed = budgets.map((b: any) => ({
      ...b,
      endYear: b.startYear + b.duration - 1
    }));

    return {
      overview,
      budgets: transformed
    };
  });

  // -------------------------------------------
  // 4. effect(): run side effects when signals change
  // -------------------------------------------
  constructor() {
    effect(() => {
      const data = this.allBudgets();
      this._logger.log(() => `Budgets updated. Count: ${data.budgets.length}`);
    });
  }

  // -------------------------------------------
  // 5. Existing business logic (preserved)
  // -------------------------------------------

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // filter logic can be implemented here
  }

  fieldsFilter(value: (Invoice) => boolean) {
    // reserved for filter functionality
  }

  toogleFilter(value: boolean) {
    this.showFilter = value;
  }

  openDialog(parent: Budget | false): void {
    const dialog = this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent ?? false
    });

    dialog.afterClosed().subscribe(() => {
      // no follow-up action required per original code
    });
  }

  /** Whether a budget can be activated */
  canPromote(record: BudgetRecord) {
    return (record.budget as any).canBeActivated;
  }

  /** Activate a budget */
  setActive(record: BudgetRecord) {
    const toSave = ___cloneDeep(record.budget);

    // Remove temporary client-only fields
    delete (toSave as any).canBeActivated;
    delete (toSave as any).access;

    toSave.status = BudgetStatus.InUse;
    (record as any).updating = true;

    this._budgets$$.update(toSave)
      .subscribe(() => {
        (record as any).updating = false;
        this._logger.log(() => `Budget ${toSave.id} set to Active`);
      });
  }
}
