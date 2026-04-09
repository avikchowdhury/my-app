import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import {
  ReceiptAiParseResult,
  ReceiptDto,
  ReceiptQueryParams,
} from '../../models';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { Category, CategoryService } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service';
import { ReceiptService } from '../../services/receipt.service';
import { ReceiptDeleteDialogComponent } from './dialogs/receipt-delete-dialog.component';
import { ReceiptEditDialogComponent } from './dialogs/receipt-edit-dialog.component';
import { ReceiptViewDialogComponent } from './dialogs/receipt-view-dialog.component';

@Component({
  selector: 'app-receipts-page',
  templateUrl: './receipts-page.component.html',
  styleUrls: ['./receipts-page.component.scss'],
})
export class ReceiptsPageComponent implements OnInit {
  receipts: ReceiptDto[] = [];
  categories: Category[] = [];
  totalReceipts = 0;
  pageSize = 10;
  pageIndex = 0;
  loading = false;

  selectedFile: File | null = null;
  aiPreview: ReceiptAiParseResult | null = null;
  parsingPreview = false;
  uploading = false;

  // Post-upload AI insight
  uploadInsight: string | null = null;
  uploadInsightLoading = false;

  // Natural language quick-entry
  nlPanelOpen = false;
  nlText = '';
  nlParsing = false;
  nlSaving = false;
  nlResult:
    | import('../../services/ai-assistant.service').ParseTextResult
    | null = null;

  // Duplicate check
  duplicateWarning: string | null = null;

  filters: ReceiptQueryParams = {
    page: 1,
    pageSize: 10,
    search: '',
    category: '',
    dateFrom: '',
    dateTo: '',
  };

  constructor(
    private receiptService: ReceiptService,
    private categoryService: CategoryService,
    private aiService: AiAssistantService,
    private dialog: MatDialog,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadReceipts();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
    });
  }

  loadReceipts(): void {
    this.loading = true;
    this.receiptService.getReceipts(this.filters).subscribe({
      next: (response) => {
        this.receipts = response.data;
        this.totalReceipts = response.total;
        this.loading = false;
      },
      error: () => {
        this.notification.error('Failed to load receipts.', 'Error');
        this.loading = false;
      },
    });
  }

  handleFiltersChange(filters: ReceiptQueryParams): void {
    this.pageIndex = 0;
    this.filters = {
      ...this.filters,
      ...filters,
      page: 1,
      pageSize: this.pageSize,
    };
    this.loadReceipts();
  }

  handlePageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filters = {
      ...this.filters,
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
    };
    this.loadReceipts();
  }

  handleFileSelected(file: File | null): void {
    this.selectedFile = file;
    this.aiPreview = null;

    if (!file) {
      return;
    }

    this.parsingPreview = true;
    this.receiptService.parseReceiptAI(file).subscribe({
      next: (preview) => {
        this.aiPreview = preview;
        this.parsingPreview = false;
        if (preview.vendor && preview.amount) {
          this.checkDuplicateOnUpload(
            preview.vendor,
            preview.amount,
            preview.date || new Date().toISOString().slice(0, 10),
          );
        }
      },
      error: () => {
        this.notification.warning(
          'AI preview is unavailable, but you can still upload the receipt.',
          'Preview unavailable',
        );
        this.parsingPreview = false;
      },
    });
  }

  uploadReceipt(payload: { category: string; notes: string }): void {
    if (!this.selectedFile || this.uploading) {
      return;
    }

    this.uploading = true;
    this.receiptService
      .uploadReceipt(this.selectedFile, {
        category: payload.category,
        notes: payload.notes,
      })
      .subscribe({
        next: () => {
          this.notification.success(
            'Receipt uploaded successfully.',
            'Uploaded',
          );
          this.triggerUploadInsight(payload.category, this.aiPreview);
          this.selectedFile = null;
          this.aiPreview = null;
          this.uploading = false;
          this.loadReceipts();
        },
        error: () => {
          this.notification.error('Failed to upload receipt.', 'Error');
          this.uploading = false;
        },
      });
  }

  clearUploadSelection(): void {
    this.selectedFile = null;
    this.aiPreview = null;
    this.duplicateWarning = null;
  }

  dismissInsight(): void {
    this.uploadInsight = null;
  }

  // Natural Language quick-entry
  openNlPanel(): void {
    this.nlPanelOpen = true;
    this.nlText = '';
    this.nlResult = null;
  }

  closeNlPanel(): void {
    this.nlPanelOpen = false;
    this.nlText = '';
    this.nlResult = null;
    this.nlSaving = false;
  }

  parseNlText(): void {
    if (!this.nlText.trim() || this.nlParsing) return;
    this.nlParsing = true;
    this.nlResult = null;
    this.aiService.parseTextExpense(this.nlText.trim()).subscribe({
      next: (r) => {
        this.nlResult = r;
        this.nlParsing = false;
      },
      error: () => {
        this.nlParsing = false;
      },
    });
  }

  saveNlReceipt(): void {
    if (!this.nlResult || this.nlSaving) return;
    const { vendor, amount, category, date } = this.nlResult;
    if (!vendor || !amount) {
      this.notification.warning('Vendor and amount are required to save.', 'Cannot save');
      return;
    }
    this.nlSaving = true;
    const dateStr = date || new Date().toISOString().slice(0, 10);
    this.receiptService.quickAddReceipt(vendor, amount, category ?? 'Uncategorized', dateStr).subscribe({
      next: () => {
        this.notification.success(`"${vendor}" added as a receipt.`, 'Saved');
        this.nlSaving = false;
        this.closeNlPanel();
        this.loadReceipts();
      },
      error: () => {
        this.notification.error('Failed to save the receipt.', 'Error');
        this.nlSaving = false;
      },
    });
  }

  // Duplicate detection - called after file selected + parsed
  checkDuplicateOnUpload(vendor: string, amount: number, date: string): void {
    if (!vendor || amount <= 0) return;
    this.duplicateWarning = null;
    this.aiService.checkDuplicate(vendor, amount, date).subscribe({
      next: (r) => {
        if (r.isDuplicate) this.duplicateWarning = r.warning;
      },
      error: () => undefined,
    });
  }

  dismissDuplicateWarning(): void {
    this.duplicateWarning = null;
  }

  private triggerUploadInsight(
    category: string,
    preview: ReceiptAiParseResult | null,
  ): void {
    const vendor = preview?.vendor || 'a vendor';
    const amount = preview?.amount
      ? `$${preview.amount.toFixed(2)}`
      : 'an amount';
    const cat = category || preview?.category || 'Uncategorized';
    const message = `I just saved a receipt from ${vendor} for ${amount} in the ${cat} category. Based on my spending history, give me one short insight about this purchase.`;

    this.uploadInsight = null;
    this.uploadInsightLoading = true;

    this.aiService.sendMessage({ message }).subscribe({
      next: (res) => {
        this.uploadInsight = res.reply;
        this.uploadInsightLoading = false;
      },
      error: () => {
        this.uploadInsightLoading = false;
      },
    });
  }

  viewReceipt(receipt: ReceiptDto): void {
    this.dialog.open(ReceiptViewDialogComponent, {
      width: '420px',
      data: { receipt },
    });
  }

  editReceipt(receipt: ReceiptDto): void {
    const dialogRef = this.dialog.open(ReceiptEditDialogComponent, {
      width: '420px',
      data: { receipt },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      const updatedReceipt = {
        ...receipt,
        category: result.category,
        parsedContentJson: result.notes,
      };

      this.receiptService.updateReceipt(receipt.id, updatedReceipt).subscribe({
        next: () => {
          this.notification.success('Receipt updated successfully.', 'Updated');
          this.loadReceipts();
        },
        error: () => {
          this.notification.error('Failed to update receipt.', 'Error');
        },
      });
    });
  }

  deleteReceipt(receipt: ReceiptDto): void {
    const dialogRef = this.dialog.open(ReceiptDeleteDialogComponent, {
      width: '360px',
      data: { receipt },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.receiptService.deleteReceipt(receipt.id).subscribe({
        next: () => {
          this.notification.success('Receipt deleted successfully.', 'Deleted');
          this.loadReceipts();
        },
        error: () => {
          this.notification.error('Failed to delete receipt.', 'Error');
        },
      });
    });
  }
}
