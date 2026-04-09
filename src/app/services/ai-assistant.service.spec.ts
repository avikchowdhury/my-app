import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AiAssistantService, SpendingForecast } from './ai-assistant.service';

describe('AiAssistantService', () => {
  let service: AiAssistantService;
  let httpMock: HttpTestingController;

  const forecast: SpendingForecast = {
    currentSpend: 120,
    projectedMonthEnd: 240,
    dailyAverage: 12,
    daysElapsed: 10,
    daysRemaining: 20,
    trend: 'on-track',
    aiNarrative: 'Looking good.',
    dailyBreakdown: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(AiAssistantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('reuses the cached forecast request for repeated subscribers', () => {
    let firstResponse: SpendingForecast | undefined;
    let secondResponse: SpendingForecast | undefined;

    service.getForecast().subscribe((response) => {
      firstResponse = response;
    });
    service.getForecast().subscribe((response) => {
      secondResponse = response;
    });

    const requests = httpMock.match('/api/ai/forecast');
    expect(requests).toHaveLength(1);

    requests[0].flush(forecast);

    expect(firstResponse).toEqual(forecast);
    expect(secondResponse).toEqual(forecast);
  });

  it('bypasses the cache when forceRefresh is true', () => {
    service.getForecast().subscribe();
    httpMock.expectOne('/api/ai/forecast').flush(forecast);

    service.getForecast(true).subscribe();
    httpMock.expectOne('/api/ai/forecast').flush({
      ...forecast,
      currentSpend: 150,
    });
  });

  it('clears cached AI responses when invalidated', () => {
    service.getForecast().subscribe();
    httpMock.expectOne('/api/ai/forecast').flush(forecast);

    service.invalidateInsightCache();
    service.getForecast().subscribe();

    httpMock.expectOne('/api/ai/forecast').flush(forecast);
  });
});
