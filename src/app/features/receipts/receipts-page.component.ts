import { PageEvent } from '@angular/material/paginator';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Category, CategoryService } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service';
import { ReceiptService } from '../../services/receipt.service';
import { ReceiptAiParseResult, ReceiptDto, ReceiptQueryParams } from '../../models';
import { ReceiptDeleteDialogComponent } from './dialogs/receipt-delete-dialog.component';
import { ReceiptEditDialogComponent } from './dialogs/receipt-edit-dialog.component';
import { ReceiptViewDialogComponent } from './dialogs/receipt-view-dialog.component';

@Component({
  selector: 'app-receipts-page',
  templateUrl: './receipts-page.component.html',
  styleUrls: ['./receipts-page.component.scss']
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

  filters: ReceiptQueryParams = {
    page: 1,
    pageSize: 10,
    search: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  };

  constructor(
    private receiptService: ReceiptService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadReceipts();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      }
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
      }
    });
  }

  handleFiltersChange(filters: ReceiptQueryParams): void {
    this.pageIndex = 0;
    this.filters = {
      ...this.filters,
      ...filters,
      page: 1,
      pageSize: this.pageSize
    };
    this.loadReceipts();
  }

  handlePageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filters = {
      ...this.filters,
      page: event.pageIndex + 1,
      pageSize: event.pageSize
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
      },
      error: () => {
        this.notification.warning('AI preview is unavailable, but you can still upload the receipt.', 'Preview unavailable');
        this.parsingPreview = false;
      }
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
        notes: payload.notes
      })
      .subscribe({
        next: () => {
          this.notification.success('Receipt uploaded successfully.', 'Uploaded');
          this.selectedFile = null;
          this.aiPreview = null;
          this.uploading = false;
          this.loadReceipts();
        },
        error: () => {
          this.notification.error('Failed to upload receipt.', 'Error');
          this.uploading = false;
        }
      });
  }

  clearUploadSelection(): void {
    this.selectedFile = null;
    this.aiPreview = null;
  }

  viewReceipt(receipt: ReceiptDto): void {
    this.dialog.open(ReceiptViewDialogComponent, {
      width: '420px',
      data: { receipt }
    });
  }

  editReceipt(receipt: ReceiptDto): void {
    const dialogRef = this.dialog.open(ReceiptEditDialogComponent, {
      width: '420px',
      data: { receipt }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      const updatedReceipt = {
        ...receipt,
        category: result.category,
        parsedContentJson: result.notes
      };

      this.receiptService.updateReceipt(receipt.id, updatedReceipt).subscribe({
        next: () => {
          this.notification.success('Receipt updated successfully.', 'Updated');
          this.loadReceipts();
        },
        error: () => {
          this.notification.error('Failed to update receipt.', 'Error');
        }
      });
    });
  }

  deleteReceipt(receipt: ReceiptDto): void {
    const dialogRef = this.dialog.open(ReceiptDeleteDialogComponent, {
      width: '360px',
      data: { receipt }
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
        }
      });
    });
  }
}
