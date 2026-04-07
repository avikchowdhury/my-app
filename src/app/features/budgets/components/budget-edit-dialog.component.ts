import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Budget } from '../../../models';

@Component({
  selector: 'app-budget-edit-dialog',
  templateUrl: './budget-edit-dialog.component.html',
  styleUrls: ['./budget-edit-dialog.component.scss']
})
export class BudgetEditDialogComponent {
  category: string;
  amount: number;

  constructor(
    public dialogRef: MatDialogRef<BudgetEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { budget?: Budget }
  ) {
    this.category = data.budget?.category || '';
    this.amount = data.budget?.amount || 0;
  }

  save() {
    this.dialogRef.close({ category: this.category, amount: this.amount });
  }

  close() {
    this.dialogRef.close();
  }
}
