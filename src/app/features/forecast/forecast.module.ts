import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ForecastRoutingModule } from './forecast-routing.module';
import { ForecastPageComponent } from './pages/forecast-page.component';

@NgModule({
  declarations: [ForecastPageComponent],
  imports: [SharedModule, ForecastRoutingModule],
})
export class ForecastModule {}
