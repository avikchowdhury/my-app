import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface CategoryEditDialogData {
  name?: string;
}

@Component({
  selector: 'app-category-edit-dialog',
  templateUrl: './category-edit-dialog.component.html',
  styleUrls: ['./category-edit-dialog.component.scss']
})
export class CategoryEditDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<CategoryEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryEditDialogData,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: [data.name || '', [Validators.required, Validators.maxLength(255)]]
    });
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close({ name: this.form.value.name.trim() });
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
