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

  starterPrompts: string[] = [...this.defaultPrompts];
  monthlySummary: MonthlySummary | null = null;
  anomalies: SpendingAnomaly[] = [];
  summaryLoading = true;
  copiedIndex: number | null = null;

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

  submit(): void {
    const message = this.prompt.trim();
    if (!message || this.loading) {
      return;
    }

    this.messages = [...this.messages, { role: 'user', content: message }];
    this.shouldScrollToBottom = true;
    this.prompt = '';
    this.loading = true;

    this.aiAssistantService.sendMessage({ message }).subscribe({
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

  trackByMessage(index: number, message: AiChatMessage): string {
    return `${message.role}-${message.createdAt || index}-${message.content.slice(0, 24)}`;
  }

  get promptLength(): number {
    return this.prompt.length;
  }

  get promptNearLimit(): boolean {
    return this.promptLength > MAX_PROMPT_LENGTH * 0.8;
  }
}
