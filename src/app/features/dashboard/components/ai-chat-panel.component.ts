import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AiChatMessage } from '../../../models';
import {
  AiAssistantService,
  MonthlySummary,
  SpendingAnomaly,
} from '../../../services/ai-assistant.service';

const MAX_PROMPT_LENGTH = 500;

type AskModeId = 'smart' | 'what-if' | 'savings' | 'app-help';

interface AskModeOption {
  id: AskModeId;
  label: string;
  description: string;
}

interface ChatActionLink {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-ai-chat-panel',
  templateUrl: './ai-chat-panel.component.html',
  styleUrls: ['./ai-chat-panel.component.scss'],
})
export class AiChatPanelComponent implements AfterViewChecked, OnInit {
  private readonly defaultPrompts = [
    'How much budget risk do I have right now?',
    'If I keep spending like this, where will month-end land?',
    'Which habits are quietly hurting my budget?',
    'Could I still afford one extra weekend outing this month?',
  ];

  readonly maxLength = MAX_PROMPT_LENGTH;
  readonly askModes: AskModeOption[] = [
    {
      id: 'smart',
      label: 'Smart',
      description: 'Balanced answer using tracker context when relevant.',
    },
    {
      id: 'what-if',
      label: 'What-If',
      description: 'Scenario planning with assumptions called out clearly.',
    },
    {
      id: 'savings',
      label: 'Savings Plan',
      description: 'Action-focused ways to cut cost or reduce month-end risk.',
    },
    {
      id: 'app-help',
      label: 'App Help',
      description: 'Best for workflow, feature, and navigation questions.',
    },
  ];

  starterPrompts: string[] = [...this.defaultPrompts];
  monthlySummary: MonthlySummary | null = null;
  anomalies: SpendingAnomaly[] = [];
  summaryLoading = true;
  copiedIndex: number | null = null;
  selectedModeId: AskModeId = 'smart';

  messages: AiChatMessage[] = [
    {
      role: 'assistant',
      content:
        'Ask about habits, tradeoffs, subscriptions, month-end risk, vendor patterns, or broad what-if scenarios. I will anchor the answer to your tracker data whenever possible.',
    },
  ];

  prompt = '';
  loading = false;
  private shouldScrollToBottom = true;

  @ViewChild('messageList')
  private messageListRef?: ElementRef<HTMLDivElement>;

  constructor(
    private aiAssistantService: AiAssistantService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  ngAfterViewChecked(): void {
    if (!this.shouldScrollToBottom || !this.messageListRef) {
      return;
    }
    const container = this.messageListRef.nativeElement;
    container.scrollTop = container.scrollHeight;
    this.shouldScrollToBottom = false;
  }

  private loadSummary(): void {
    this.summaryLoading = true;
    this.aiAssistantService.getMonthlySummary().subscribe({
      next: (summary) => {
        this.monthlySummary = summary;
        this.anomalies = summary.anomalies ?? [];
        if (this.anomalies.length > 0) {
          this.starterPrompts = [
            `Why is my ${this.anomalies[0].category} spending so high?`,
            'What patterns are pushing my month off track?',
            'Which subscriptions should I review first?',
            'What is the simplest way to lower this month-end risk?',
          ];
        }
        this.summaryLoading = false;
      },
      error: () => {
        this.summaryLoading = false;
      },
    });
  }

  clearChat(): void {
    this.messages = [
      {
        role: 'assistant',
        content:
          'Chat cleared. Ask anything from a quick budget check to a broad spending what-if.',
      },
    ];
    this.shouldScrollToBottom = true;
  }

  copyMessage(content: string, index: number): void {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        this.copiedIndex = index;
        setTimeout(() => {
          this.copiedIndex = null;
        }, 2000);
      })
      .catch(() => {});
  }

  usePrompt(p: string): void {
    this.prompt = p;
    this.submit();
  }

  setAskMode(modeId: AskModeId): void {
    this.selectedModeId = modeId;
  }

  submit(): void {
    const message = this.prompt.trim();
    if (!message || this.loading) {
      return;
    }

    this.messages = [...this.messages, { role: 'user', content: message }];
    this.shouldScrollToBottom = true;
    this.prompt = '';
    this.loading = true;

    this.aiAssistantService
      .sendMessage({ message: this.buildModeAwarePrompt(message) })
      .subscribe({
      next: (response) => {
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            content: response.reply,
            createdAt: response.generatedAt,
            response,
          },
        ];
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            content:
              'I could not reach the spending assistant just now. Try again after the API is available.',
          },
        ];
        this.shouldScrollToBottom = true;
      },
      complete: () => {
        this.loading = false;
      },
      });
  }

  regenerateLastAnswer(): void {
    if (this.loading || !this.lastUserMessage) {
      return;
    }

    this.prompt = this.lastUserMessage.content;
    this.submit();
  }

  openAction(action: ChatActionLink): void {
    this.router.navigateByUrl(action.route);
  }

  private buildModeAwarePrompt(message: string): string {
    switch (this.selectedModeId) {
      case 'what-if':
        return `What-if scenario: ${message}\n\nPlease evaluate the scenario, make assumptions explicit, and connect the answer to my current spending patterns when possible.`;
      case 'savings':
        return `Savings plan request: ${message}\n\nPlease focus on practical cost-cutting ideas, tradeoffs, and the simplest next actions.`;
      case 'app-help':
        return `App help request: ${message}\n\nPlease answer as a product guide and point me to the right screen or feature when relevant.`;
      case 'smart':
      default:
        return message;
    }
  }

  trackByMessage(index: number, message: AiChatMessage): string {
    return `${message.role}-${message.createdAt || index}-${message.content.slice(0, 24)}`;
  }

  get promptLength(): number {
    return this.prompt.length;
  }

  get promptNearLimit(): boolean {
    return this.promptLength > MAX_PROMPT_LENGTH * 0.8;
  }

  get selectedMode(): AskModeOption {
    return (
      this.askModes.find((mode) => mode.id === this.selectedModeId) ||
      this.askModes[0]
    );
  }

  get lastUserMessage(): AiChatMessage | null {
    for (let index = this.messages.length - 1; index >= 0; index -= 1) {
      if (this.messages[index].role === 'user') {
        return this.messages[index];
      }
    }

    return null;
  }

  get lastAssistantMessage(): AiChatMessage | null {
    for (let index = this.messages.length - 1; index >= 0; index -= 1) {
      if (this.messages[index].role === 'assistant' && this.messages[index].response) {
        return this.messages[index];
      }
    }

    return null;
  }

  get latestSuggestions(): string[] {
    return this.lastAssistantMessage?.response?.suggestions ?? [];
  }

  get latestActionLinks(): ChatActionLink[] {
    const lastAssistant = this.lastAssistantMessage;
    const latestUser = this.lastUserMessage;

    if (!lastAssistant?.response) {
      return [];
    }

    const routeMap = new Map<string, ChatActionLink>();
    const referencedMetrics = lastAssistant.response.referencedMetrics.map((metric) =>
      metric.toLowerCase(),
    );
    const combinedText = [
      latestUser?.content ?? '',
      lastAssistant.response.reply,
      ...lastAssistant.response.referencedMetrics,
      ...lastAssistant.response.suggestions,
    ]
      .join(' ')
      .toLowerCase();

    const addRoute = (label: string, route: string, icon: string): void => {
      routeMap.set(route, { label, route, icon });
    };

    if (
      referencedMetrics.some((metric) => metric.includes('budget')) ||
      combinedText.includes('budget') ||
      combinedText.includes('save') ||
      combinedText.includes('overspend')
    ) {
      addRoute('Open Budgets', '/budgets', 'savings');
      addRoute('View Forecast', '/forecast', 'insights');
    }

    if (
      referencedMetrics.some((metric) => metric.includes('recurring')) ||
      combinedText.includes('subscription') ||
      combinedText.includes('recurring')
    ) {
      addRoute('Open Subscription Insights', '/insights?tab=subscriptions', 'autorenew');
      addRoute('Review Receipts', '/receipts', 'receipt_long');
    }

    if (
      referencedMetrics.some((metric) => metric.includes('alert')) ||
      combinedText.includes('anomaly') ||
      combinedText.includes('risk') ||
      combinedText.includes('spike')
    ) {
      addRoute('Open Risk Insights', '/insights?tab=anomalies', 'warning_amber');
      addRoute('Check Forecast', '/forecast', 'show_chart');
    }

    if (
      referencedMetrics.some((metric) => metric.includes('receipt')) ||
      combinedText.includes('vendor') ||
      combinedText.includes('merchant') ||
      combinedText.includes('receipt')
    ) {
      addRoute('Open Receipts', '/receipts', 'receipt_long');
      addRoute('Manage Categories', '/categories', 'category');
    }

    if (combinedText.includes('how to use') || combinedText.includes('screen')) {
      addRoute('Open Dashboard', '/dashboard', 'dashboard');
      addRoute('Open Profile', '/profile', 'manage_accounts');
    }

    return Array.from(routeMap.values()).slice(0, 3);
  }
}
