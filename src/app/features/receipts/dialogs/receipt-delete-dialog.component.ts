import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReceiptDto } from '../../../models';

@Component({
  selector: 'app-receipt-delete-dialog',
  templateUrl: './receipt-delete-dialog.component.html',
  styleUrls: ['./receipt-delete-dialog.component.scss']
})
export class ReceiptDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReceiptDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { receipt: ReceiptDto }
  ) {}

  confirm() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
