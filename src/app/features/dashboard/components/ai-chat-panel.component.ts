import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AiAssistantService, MonthlySummary, SpendingAnomaly } from '../../../services/ai-assistant.service';
import { AiChatMessage } from '../../../models';

const MAX_PROMPT_LENGTH = 500;

@Component({
  selector: 'app-ai-chat-panel',
  templateUrl: './ai-chat-panel.component.html',
  styleUrls: ['./ai-chat-panel.component.scss']
})
export class AiChatPanelComponent implements AfterViewChecked, OnInit {
  private readonly defaultPrompts = [
    'How much budget risk do I have right now?',
    'Which subscriptions should I review first?',
    'How can I reduce my budget risk?',
    'Summarize my latest receipt activity.'
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
      content: 'Ask about budgets, subscriptions, receipt activity, or where your spend is drifting. I answer from your tracker data, not guesses.'
    }
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
            'What anomalies do you see in my spending?',
            'Which subscriptions should I review first?',
            'How can I reduce my budget risk?',
          ];
        }
        this.summaryLoading = false;
      },
      error: () => {
        this.summaryLoading = false;
      }
    });
  }

  clearChat(): void {
    this.messages = [
      {
        role: 'assistant',
        content: 'Chat cleared. What would you like to know about your spending?'
      }
    ];
    this.shouldScrollToBottom = true;
  }

  copyMessage(content: string, index: number): void {
    navigator.clipboard.writeText(content).then(() => {
      this.copiedIndex = index;
      setTimeout(() => { this.copiedIndex = null; }, 2000);
    }).catch(() => {});
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
            response
          }
        ];
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            content: 'I could not reach the AI assistant just now. Try again after the API is available.'
          }
        ];
        this.shouldScrollToBottom = true;
      },
      complete: () => {
        this.loading = false;
      }
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
