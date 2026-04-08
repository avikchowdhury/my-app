import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category, VendorCategoryRule } from '../../../services/category.service';

@Component({
  selector: 'app-vendor-rule-manager',
  templateUrl: './vendor-rule-manager.component.html',
  styleUrls: ['./vendor-rule-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorRuleManagerComponent implements OnChanges {
  @Input() categories: Category[] = [];
  @Input() rules: VendorCategoryRule[] = [];
  @Input() loading = false;
  @Input() saving = false;
  @Output() createRule = new EventEmitter<{ categoryId: number; vendorPattern: string }>();
  @Output() updateRule = new EventEmitter<{ id: number; categoryId: number; vendorPattern: string }>();
  @Output() deleteRule = new EventEmitter<number>();

  readonly form: FormGroup;
  editingRuleId: number | null = null;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      vendorPattern: ['', [Validators.required, Validators.minLength(2)]],
      categoryId: [null, Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rules'] && !this.saving) {
      this.resetForm();
      return;
    }

    if (changes['categories'] && this.categories.length && !this.form.get('categoryId')?.value && !this.editingRuleId) {
      this.form.patchValue({ categoryId: this.categories[0].id });
    }
  }

  startEditing(rule: VendorCategoryRule): void {
    this.editingRuleId = rule.id;
    this.form.patchValue({
      vendorPattern: rule.vendorPattern,
      categoryId: rule.categoryId
    });
  }

  cancelEditing(): void {
    this.editingRuleId = null;
    this.resetForm();
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      vendorPattern: String(this.form.value.vendorPattern || '').trim(),
      categoryId: Number(this.form.value.categoryId)
    };

    if (this.editingRuleId) {
      this.updateRule.emit({
        id: this.editingRuleId,
        ...payload
      });
      return;
    }

    this.createRule.emit(payload);
  }

  remove(ruleId: number): void {
    if (this.saving) {
      return;
    }

    this.deleteRule.emit(ruleId);
  }
  private resetForm(): void {
    this.editingRuleId = null;
    this.form.reset({
      vendorPattern: '',
      categoryId: this.categories[0]?.id ?? null
    });
  }
}
