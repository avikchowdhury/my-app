import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
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

  constructor(private aiAssistantService: AiAssistantService) {}

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
}
