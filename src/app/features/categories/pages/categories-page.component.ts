import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { Category, CategoryService } from '../../../services/category.service';
import { CategoryEditDialogComponent } from '../components/category-edit-dialog.component';

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss']
})
export class CategoriesPageComponent implements OnInit {
  categories: Category[] = [];
  loading = false;

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.loading = false;
      },
      error: () => {
        this.notification.error('Failed to load categories');
        this.loading = false;
      }
    });
  }

  addCategory() {
    const dialogRef = this.dialog.open(CategoryEditDialogComponent, {
      width: '350px',
      data: {}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.name) {
        this.categoryService.addCategory(result.name).subscribe({
          next: (cat) => {
            this.notification.success('Category added');
            this.loadCategories();
          },
          error: () => this.notification.error('Failed to add category')
        });
      }
    });
  }

  editCategory(category: Category) {
    const dialogRef = this.dialog.open(CategoryEditDialogComponent, {
      width: '350px',
      data: { name: category.name }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.name && result.name !== category.name) {
        this.categoryService.updateCategory(category.id, result.name).subscribe({
          next: (updated) => {
            this.notification.success('Category updated');
            this.loadCategories();
          },
          error: (err) => {
            if (err.status === 409) {
              this.notification.error('Category name already exists');
            } else {
              this.notification.error('Failed to update category');
            }
          }
        });
      }
    });
  }

  deleteCategory(category: Category) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Delete Category',
        message: 'Are you sure you want to delete this category?'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.notification.success('Category deleted');
          this.loadCategories();
        },
        error: () => this.notification.error('Failed to delete category')
      });
    });
  }
}
