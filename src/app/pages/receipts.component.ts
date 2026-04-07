import { Component } from '@angular/core';

@Component({
  selector: 'app-receipts',
  templateUrl: './receipts.component.html',
  styleUrls: ['./receipts.component.scss'],
})
export class ReceiptsComponent {
  readonly message =
    'Legacy receipts component replaced by the lazy-loaded receipts feature.';
}
