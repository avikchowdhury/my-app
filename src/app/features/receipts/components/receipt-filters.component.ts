import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Category } from '../../../services/category.service';
import { ReceiptQueryParams } from '../../../models';

@Component({
  selector: 'app-receipt-filters',
  templateUrl: './receipt-filters.component.html',
  styleUrls: ['./receipt-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptFiltersComponent implements OnChanges {
  @Input() categories: Category[] = [];
  @Input() filters: ReceiptQueryParams = {};
  @Output() filtersChange = new EventEmitter<ReceiptQueryParams>();

  draftFilters: ReceiptQueryParams = {};

  ngOnChanges(): void {
    this.draftFilters = { ...this.filters };
  }

  apply(): void {
    this.filtersChange.emit({
      search: this.draftFilters.search || '',
      category: this.draftFilters.category || '',
      dateFrom: this.draftFilters.dateFrom || '',
      dateTo: this.draftFilters.dateTo || ''
    });
  }

  reset(): void {
    this.draftFilters = {
      ...this.draftFilters,
      search: '',
      category: '',
      dateFrom: '',
      dateTo: ''
    };
    this.apply();
  }
}
