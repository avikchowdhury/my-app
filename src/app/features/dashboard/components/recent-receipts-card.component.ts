import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ReceiptDto } from '../../../models';

interface DashboardCalendarDayCell {
  dayNumber: number;
  receiptCount: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-recent-receipts-card',
  templateUrl: './recent-receipts-card.component.html',
  styleUrls: ['./recent-receipts-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentReceiptsCardComponent implements OnChanges {
  @Input() receipts: ReceiptDto[] = [];
  @Input() calendarReceipts: ReceiptDto[] = [];

  readonly sampleReceiptPath = 'assets/sample-receipts/freshmart-groceries-87.45-receipt.pdf';
  readonly weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  monthLabel = '';
  calendarDays: DashboardCalendarDayCell[] = [];
  activeDays = 0;
  calendarTotal = 0;

  get totalRecentAmount(): number {
    return this.receipts.reduce((total, receipt) => total + receipt.totalAmount, 0);
  }

  get primaryCategory(): string {
    const firstCategorized = this.receipts.find((receipt) => !!receipt.category)?.category;
    return firstCategorized || 'Uncategorized';
  }

  ngOnChanges(): void {
    this.buildCalendar();
  }

  private buildCalendar(): void {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const firstGridDate = new Date(monthStart);
    firstGridDate.setDate(firstGridDate.getDate() - monthStart.getDay());

    const receiptMap = new Map<string, { count: number; total: number }>();
    this.calendarTotal = 0;

    this.calendarReceipts.forEach((receipt) => {
      const uploadedAt = new Date(receipt.uploadedAt);
      if (
        uploadedAt.getFullYear() !== today.getFullYear() ||
        uploadedAt.getMonth() !== today.getMonth()
      ) {
        return;
      }

      const key = uploadedAt.toISOString().slice(0, 10);
      const current = receiptMap.get(key) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += receipt.totalAmount;
      receiptMap.set(key, current);
      this.calendarTotal += receipt.totalAmount;
    });

    this.activeDays = receiptMap.size;
    this.monthLabel = monthStart.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric'
    });

    this.calendarDays = Array.from({ length: 35 }).map((_, index) => {
      const cellDate = new Date(firstGridDate);
      cellDate.setDate(firstGridDate.getDate() + index);
      const key = cellDate.toISOString().slice(0, 10);
      const match = receiptMap.get(key);

      return {
        dayNumber: cellDate.getDate(),
        receiptCount: match?.count ?? 0,
        isCurrentMonth:
          cellDate.getFullYear() === today.getFullYear() &&
          cellDate.getMonth() === today.getMonth(),
        isToday:
          cellDate.getFullYear() === today.getFullYear() &&
          cellDate.getMonth() === today.getMonth() &&
          cellDate.getDate() === today.getDate()
      };
    });
  }
}
