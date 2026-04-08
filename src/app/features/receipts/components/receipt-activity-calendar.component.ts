import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ReceiptDto } from '../../../models';

interface CalendarDayCell {
  date: Date | null;
  dayNumber: number | null;
  receiptCount: number;
  totalAmount: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-receipt-activity-calendar',
  templateUrl: './receipt-activity-calendar.component.html',
  styleUrls: ['./receipt-activity-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptActivityCalendarComponent implements OnChanges {
  @Input() receipts: ReceiptDto[] = [];

  readonly weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthLabel = '';
  dayCells: CalendarDayCell[] = [];
  activeDays = 0;
  visibleTotal = 0;
  busiestDayLabel = 'No uploads yet';

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
    this.visibleTotal = 0;

    this.receipts.forEach((receipt) => {
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
      this.visibleTotal += receipt.totalAmount;
    });

    this.activeDays = receiptMap.size;
    this.monthLabel = monthStart.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });

    let busiestDayKey = '';
    let busiestDayCount = 0;
    receiptMap.forEach((value, key) => {
      if (value.count > busiestDayCount) {
        busiestDayCount = value.count;
        busiestDayKey = key;
      }
    });
    this.busiestDayLabel = busiestDayKey
      ? new Date(busiestDayKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : 'No uploads yet';

    this.dayCells = Array.from({ length: 35 }).map((_, index) => {
      const cellDate = new Date(firstGridDate);
      cellDate.setDate(firstGridDate.getDate() + index);

      const key = cellDate.toISOString().slice(0, 10);
      const match = receiptMap.get(key);

      return {
        date: cellDate,
        dayNumber: cellDate.getDate(),
        receiptCount: match?.count ?? 0,
        totalAmount: match?.total ?? 0,
        isToday:
          cellDate.getFullYear() === today.getFullYear() &&
          cellDate.getMonth() === today.getMonth() &&
          cellDate.getDate() === today.getDate(),
        isCurrentMonth:
          cellDate >= monthStart && cellDate <= monthEnd
      };
    });
  }
}
