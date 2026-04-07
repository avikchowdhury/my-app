import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ProfilePageComponent } from './pages/profile-page.component';
import { ProfileRoutingModule } from './profile-routing.module';

@NgModule({
  declarations: [ProfilePageComponent],
  imports: [SharedModule, ProfileRoutingModule]
})
export class ProfileModule {}
