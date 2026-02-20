// NOTE: This component requires Angular 17+.
// signal(), computed(), effect(), toSignal(), inject() and ChangeDetectionStrategy.OnPush
// are Angular 16/17 features.
// To enable fully zoneless change detection, add provideExperimentalZonelessChangeDetection()
// to the root providers in app.module.ts and remove zone.js from polyfills.

import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';

import { cloneDeep as ___cloneDeep, flatMap as __flatMap } from 'lodash';

import { Logger } from '@iote/bricks-angular';

import { Budget, BudgetRecord, BudgetStatus, OrgBudgetsOverview } from '@app/model/finance/planning/budgets';
import { BudgetsStore, OrgBudgetsStore } from '@app/state/finance/budgetting/budgets';

import { CreateBudgetModalComponent } from '../../components/create-budget-modal/create-budget-modal.component';


@Component({
  selector: 'app-select-budget',
  templateUrl: './select-budget.component.html',
  styleUrls: [
    './select-budget.component.scss',
    '../../components/budget-view-styles.scss'
  ],
  // OnPush: Angular only re-checks this component when its signals change.
  // Combined with provideExperimentalZonelessChangeDetection() in root providers
  // this makes the component fully "zoneless" — no Zone.js ticking required.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/** List of all active budgets on the system — Signals Refactor */
export class SelectBudgetPageComponent
{
  // --- inject() replaces constructor parameters ---
  private _orgBudgets$$ = inject(OrgBudgetsStore);
  private _budgets$$    = inject(BudgetsStore);
  private _dialog       = inject(MatDialog);
  private _logger       = inject(Logger);

  // --- UI state as a signal instead of a plain boolean ---
  showFilter = signal(false);

  // --- Convert RxJS observables → signals via toSignal() ---
  // toSignal subscribes automatically and keeps the signal in sync.
  // initialValue is returned until the first observable emission.
  private overviewRaw = toSignal(this._orgBudgets$$.get(), { initialValue: {} as OrgBudgetsOverview });
  private budgetsRaw  = toSignal(this._budgets$$.get(),    { initialValue: [] });

  // --- computed() replaces combineLatest + map pipeline ---
  // Recalculates automatically whenever overviewRaw or budgetsRaw change.
  allBudgets = computed(() => {
    const overview  = __flatMap(this.overviewRaw()) as BudgetRecord[];
    const budgets   = __flatMap(this.budgetsRaw());

    const enriched = budgets.map((b: any) => ({
      ...b,
      endYear: b.startYear + b.duration - 1,
    }));

    return { overview, budgets: enriched };
  });

  constructor() {
    // --- effect() replaces imperative subscribe() side effects ---
    // Runs reactively whenever allBudgets signal changes.
    effect(() => {
      const data = this.allBudgets();
      this._logger.log(() => `[SelectBudgetPage] Budgets updated. Count: ${data.budgets.length}`);
    });
  }

  applyFilter(event: Event) {
    const _filterValue = (event.target as HTMLInputElement).value;
    // TODO: wire up table filter
  }

  fieldsFilter(_value: (invoice: any) => boolean) {
    // TODO: wire up field-level filter
  }

  toogleFilter(value: boolean) {
    // .set() mutates the signal — triggers OnPush change detection automatically
    this.showFilter.set(value);
  }

  openDialog(parent: Budget | false): void {
    const dialog = this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent ?? false,
    });

    dialog.afterClosed().subscribe(() => {
      // Dialog after action
    });
  }

  /** @TODO - Review and fix. Returns true if the budget can be activated. */
  canPromote(record: BudgetRecord) {
    return (record.budget as any).canBeActivated;
  }

  /** Activate budget — promote to be used in production. */
  setActive(record: BudgetRecord) {
    const toSave = ___cloneDeep(record.budget);

    delete (toSave as any).canBeActivated;
    delete (toSave as any).access;

    toSave.status = BudgetStatus.InUse;
    (record as any).updating = true;

    this._budgets$$.update(toSave).subscribe(() => {
      (record as any).updating = false;
      this._logger.log(() => `Budget ${toSave.id} set to Active.`);
    });
  }
}
