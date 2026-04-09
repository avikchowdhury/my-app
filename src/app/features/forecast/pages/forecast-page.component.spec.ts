import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import {
  AiAssistantService,
  SpendingForecast,
} from '../../../services/ai-assistant.service';
import { ForecastPageComponent } from './forecast-page.component';

describe('ForecastPageComponent', () => {
  let fixture: ComponentFixture<ForecastPageComponent>;
  let component: ForecastPageComponent;
  let aiService: { getForecast: jest.Mock };

  const forecast: SpendingForecast = {
    currentSpend: 300,
    projectedMonthEnd: 620,
    dailyAverage: 20,
    daysElapsed: 15,
    daysRemaining: 15,
    trend: 'warning',
    aiNarrative: 'Keep an eye on dining.',
    dailyBreakdown: [
      { date: '2026-04-01', amount: 10, isProjected: false },
      { date: '2026-04-02', amount: 20, isProjected: false },
      { date: '2026-04-16', amount: 20, isProjected: true },
    ],
  };

  beforeEach(async () => {
    aiService = {
      getForecast: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule,
      ],
      declarations: [ForecastPageComponent],
      providers: [
        {
          provide: AiAssistantService,
          useValue: aiService,
        },
      ],
    }).compileComponents();
  });

  it('loads forecast on init and maps chart heights', () => {
    const response$ = new Subject<SpendingForecast>();
    aiService.getForecast.mockReturnValue(response$.asObservable());

    fixture = TestBed.createComponent(ForecastPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(aiService.getForecast).toHaveBeenCalledWith(false);
    expect(component.loading).toBe(true);

    response$.next(forecast);
    response$.complete();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.loadError).toBe(false);
    expect(component.chartDays).toHaveLength(3);
    expect(component.chartDays[1].barHeight).toBe(100);
    expect(component.chartDays[0].barHeight).toBe(50);
    expect(component.trendLabel).toBe('Approaching limit');
  });

  it('shows an error state when forecast loading fails', () => {
    aiService.getForecast.mockReturnValue(
      throwError(() => new Error('forecast failed')),
    );

    fixture = TestBed.createComponent(ForecastPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.loadError).toBe(true);
    expect(component.forecast).toBeNull();
    expect(component.chartDays).toEqual([]);
  });

  it('uses force refresh when manual reload is requested', () => {
    aiService.getForecast.mockReturnValue(of(forecast));

    fixture = TestBed.createComponent(ForecastPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    aiService.getForecast.mockClear();
    component.load(true);

    expect(aiService.getForecast).toHaveBeenCalledWith(true);
  });
});
