import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReceiptDto } from '../../../models';

@Component({
  selector: 'app-receipt-edit-dialog',
  templateUrl: './receipt-edit-dialog.component.html',
  styleUrls: ['./receipt-edit-dialog.component.scss']
})
export class ReceiptEditDialogComponent {
  category: string;
  notes: string;

  constructor(
    public dialogRef: MatDialogRef<ReceiptEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { receipt: ReceiptDto }
  ) {
    this.category = data.receipt.category || '';
    this.notes = (data.receipt as any).notes || '';
  }

  save() {
    this.dialogRef.close({ category: this.category, notes: this.notes });
  }

  close() {
    this.dialogRef.close();
  }
}
