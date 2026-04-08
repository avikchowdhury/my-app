import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Category } from '../../../services/category.service';
import { ReceiptAiParseResult } from '../../../models';

@Component({
  selector: 'app-receipt-upload-assistant',
  templateUrl: './receipt-upload-assistant.component.html',
  styleUrls: ['./receipt-upload-assistant.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptUploadAssistantComponent implements OnChanges {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @Input() selectedFile: File | null = null;
  @Input() preview: ReceiptAiParseResult | null = null;
  @Input() parsingPreview = false;
  @Input() uploading = false;
  @Input() categories: Category[] = [];

  @Output() fileSelected = new EventEmitter<File | null>();
  @Output() uploadRequested = new EventEmitter<{ category: string; notes: string }>();
  @Output() cleared = new EventEmitter<void>();

  readonly userManualHref = 'assets/help/expense-tracker-user-manual.html';
  readonly sampleReceipts = [
    {
      label: 'Freshmart groceries',
      fileName: 'freshmart-groceries-87.45-receipt.pdf',
      href: 'assets/sample-receipts/freshmart-groceries-87.45-receipt.pdf'
    },
    {
      label: 'Netflix subscription February',
      fileName: 'netflix-subscription-15.99-february-receipt.pdf',
      href: 'assets/sample-receipts/netflix-subscription-15.99-february-receipt.pdf'
    },
    {
      label: 'Netflix subscription March',
      fileName: 'netflix-subscription-15.99-march-receipt.pdf',
      href: 'assets/sample-receipts/netflix-subscription-15.99-march-receipt.pdf'
    },
    {
      label: 'Uber airport travel',
      fileName: 'uber-airport-travel-32.60-receipt.pdf',
      href: 'assets/sample-receipts/uber-airport-travel-32.60-receipt.pdf'
    },
    {
      label: 'Sunrise cafe dining',
      fileName: 'sunrise-cafe-dining-24.50-receipt.pdf',
      href: 'assets/sample-receipts/sunrise-cafe-dining-24.50-receipt.pdf'
    },
    {
      label: 'Skyline housing rent',
      fileName: 'skyline-rent-housing-1250.00-receipt.pdf',
      href: 'assets/sample-receipts/skyline-rent-housing-1250.00-receipt.pdf'
    }
  ];

  category = '';
  notes = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preview'] && this.preview) {
      this.category = this.preview.category || this.category;
    }

    if (changes['selectedFile'] && !this.selectedFile) {
      this.category = '';
      this.notes = '';
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileSelected.emit(input.files?.[0] || null);
  }

  clear(): void {
    this.category = '';
    this.notes = '';
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    this.cleared.emit();
  }

  upload(): void {
    this.uploadRequested.emit({
      category: this.category,
      notes: this.notes
    });
  }
}
