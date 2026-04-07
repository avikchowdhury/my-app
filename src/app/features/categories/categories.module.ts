import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CategoryEditDialogComponent } from './components/category-edit-dialog.component';
import { CategoriesPageComponent } from './pages/categories-page.component';
import { CategoriesRoutingModule } from './categories-routing.module';

@NgModule({
  declarations: [CategoriesPageComponent, CategoryEditDialogComponent],
  imports: [SharedModule, CategoriesRoutingModule]
})
export class CategoriesModule {}
