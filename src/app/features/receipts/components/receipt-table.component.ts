import { PageEvent } from '@angular/material/paginator';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ReceiptDto } from '../../../models';

@Component({
  selector: 'app-receipt-table',
  templateUrl: './receipt-table.component.html',
  styleUrls: ['./receipt-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptTableComponent {
  @Input() receipts: ReceiptDto[] = [];
  @Input() loading = false;
  @Input() totalReceipts = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() view = new EventEmitter<ReceiptDto>();
  @Output() edit = new EventEmitter<ReceiptDto>();
  @Output() delete = new EventEmitter<ReceiptDto>();

  readonly displayedColumns = ['date', 'vendor', 'amount', 'category', 'actions'];
}
