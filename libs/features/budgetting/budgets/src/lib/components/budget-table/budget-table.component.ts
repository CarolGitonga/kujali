// NOTE: This component requires Angular 17+.
// input(), output(), effect(), computed() and ChangeDetectionStrategy.OnPush
// are Angular 17 features used here for signal-based reactivity and zoneless support.

import {
  Component,
  AfterViewInit,
  ViewChild,
  inject,
  effect,
  computed,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';

import { Budget, BudgetRecord } from '@app/model/finance/planning/budgets';

import { ShareBudgetModalComponent } from '../share-budget-modal/share-budget-modal.component';
import { CreateBudgetModalComponent } from '../create-budget-modal/create-budget-modal.component';
import { ChildBudgetsModalComponent } from '../../modals/child-budgets-modal/child-budgets-modal.component';

@Component({
  selector: 'app-budget-table',
  templateUrl: './budget-table.component.html',
  styleUrls: ['./budget-table.component.scss'],
  // OnPush: Angular only checks this component when its signal inputs change.
  // With provideExperimentalZonelessChangeDetection() in root providers this
  // becomes a fully zoneless component — no Zone.js ticking required.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetTableComponent implements AfterViewInit {

  // --- inject() replaces constructor parameters ---
  private _router$$ = inject(Router);
  private _dialog   = inject(MatDialog);

  // --- Signal-based inputs replace @Input() + Observable pattern (Angular 17) ---
  // The parent binds plain values; Angular wraps them into signals automatically.
  // Child reads them with () — e.g. this.budgets()
  budgets    = input<{ overview: BudgetRecord[]; budgets: any[] }>();
  canPromote = input<boolean>(false);

  // --- Signal-based output replaces @Output() + EventEmitter (Angular 17) ---
  doPromote = output<void>();

  readonly dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['name', 'status', 'startYear', 'duration', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sort', { static: true }) sort: MatSort;

  // --- computed() replaces the plain overviewBudgets class field ---
  // Recalculates automatically whenever the budgets input signal changes.
  overviewBudgets = computed<BudgetRecord[]>(() => this.budgets()?.overview ?? []);

  constructor() {
    // --- effect() replaces ngOnInit + SubSink subscription ---
    // Runs reactively whenever the budgets input signal emits a new value.
    // Keeps the imperative MatTableDataSource in sync with signal state.
    effect(() => {
      this.dataSource.data = this.budgets()?.budgets ?? [];
    });
  }

  /**
   * Checks whether the user has access to a certain feature.
   * @TODO @IanOdhiambo9 - Please put proper access control architecture in place.
   */
  access(requested: any) {
    switch (requested) {
      case 'view':
      case 'clone':
        return true;
      case 'edit':
        return true;
    }
    return false;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  filterAccountRecords(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  promote() {
    // Read signal value with () instead of plain property access
    if (this.canPromote()) {
      this.doPromote.emit();
    }
  }

  /** Open share screen to configure budget access. */
  openShareBudgetDialog(parent: Budget | false): void {
    this._dialog.open(ShareBudgetModalComponent, {
      panelClass: 'no-pad-dialog',
      width: '600px',
      data: parent ?? false,
    });
  }

  /** Open clone screen to clone and reconfigure budget. */
  openCloneBudgetDialog(parent: Budget | false): void {
    this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent ?? false,
    });
  }

  openChildBudgetDialog(parent: Budget): void {
    // Read computed signal with () — replaces plain array access
    let children: any = this.overviewBudgets().find(
      (budget) => budget.budget.id === parent.id
    )?.children;
    children = children?.map((child: any) => child.budget);

    this._dialog.open(ChildBudgetsModalComponent, {
      height: 'fit-content',
      minWidth: '600px',
      data: { parent, budgets: children },
    });
  }

  goToDetail(budgetId: string, action: string) {
    this._router$$.navigate(['budgets', budgetId, action]).then(() => this._dialog.closeAll());
  }

  deleteBudget(_budget: Budget) {
    // TODO: implement delete
  }

  translateStatus(status: number) {
    switch (status) {
      case 1:  return 'BUDGET.STATUS.ACTIVE';
      case 0:  return 'BUDGET.STATUS.DESIGN';
      case 9:  return 'BUDGET.STATUS.NO-USE';
      case -1: return 'BUDGET.STATUS.DELETED';
      default: return '';
    }
  }
}
