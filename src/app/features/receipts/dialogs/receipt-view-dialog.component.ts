import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReceiptDto } from '../../../models';

@Component({
  selector: 'app-receipt-view-dialog',
  templateUrl: './receipt-view-dialog.component.html',
  styleUrls: ['./receipt-view-dialog.component.scss']
})
export class ReceiptViewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReceiptViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { receipt: ReceiptDto }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
