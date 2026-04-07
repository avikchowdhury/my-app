import { NgModule } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service';
import { SharedModule } from '../../shared/shared.module';
import { ReceiptFiltersComponent } from './components/receipt-filters.component';
import { ReceiptActivityCalendarComponent } from './components/receipt-activity-calendar.component';
import { ReceiptTableComponent } from './components/receipt-table.component';
import { ReceiptUploadAssistantComponent } from './components/receipt-upload-assistant.component';
import { ReceiptDeleteDialogComponent } from './dialogs/receipt-delete-dialog.component';
import { ReceiptEditDialogComponent } from './dialogs/receipt-edit-dialog.component';
import { ReceiptViewDialogComponent } from './dialogs/receipt-view-dialog.component';
import { ReceiptsPageComponent } from './receipts-page.component';
import { ReceiptsRoutingModule } from './receipts-routing.module';

@NgModule({
  declarations: [
    ReceiptsPageComponent,
    ReceiptUploadAssistantComponent,
    ReceiptActivityCalendarComponent,
    ReceiptFiltersComponent,
    ReceiptTableComponent,
    ReceiptViewDialogComponent,
    ReceiptEditDialogComponent,
    ReceiptDeleteDialogComponent
  ],
  imports: [SharedModule, ReceiptsRoutingModule],
  providers: [CategoryService, NotificationService]
})
export class ReceiptsModule {}
