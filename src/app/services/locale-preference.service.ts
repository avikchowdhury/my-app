import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SupportedCountryCode =
  | 'IN'
  | 'US'
  | 'GB'
  | 'CA'
  | 'AU'
  | 'DE'
  | 'FR'
  | 'JP'
  | 'SG'
  | 'AE';

type SupportedLanguageCode = 'en' | 'hi' | 'de' | 'fr' | 'ja' | 'ar';
export type ExpenseCurrencyCode = 'INR' | 'USD';

export interface CountryPreference {
  code: SupportedCountryCode;
  name: string;
  flag: string;
  locale: string;
  languageCode: SupportedLanguageCode;
  languageLabel: string;
  currencyCode: 'USD' | 'INR';
  currencySymbol: string;
  usdExchangeRate: number;
}

const DEFAULT_COUNTRY_CODE: SupportedCountryCode = 'IN';
const STORAGE_KEY = 'expense-tracker-country-preference';
const INR_SYMBOL = String.fromCodePoint(0x20b9);
const FLAG_BASE_CODE_POINT = 127397;

function toFlagIcon(code: string): string {
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (char) =>
      String.fromCodePoint(FLAG_BASE_CODE_POINT + char.charCodeAt(0)),
    );
}

const COUNTRY_PREFERENCES: CountryPreference[] = [
  {
    code: 'IN',
    name: 'India',
    flag: toFlagIcon('IN'),
    locale: 'en-IN',
    languageCode: 'en',
    languageLabel: 'English',
    currencyCode: 'INR',
    currencySymbol: INR_SYMBOL,
    usdExchangeRate: 94,
  },
  {
    code: 'US',
    name: 'United States',
    flag: toFlagIcon('US'),
    locale: 'en-US',
    languageCode: 'en',
    languageLabel: 'English',
    currencyCode: 'USD',
    currencySymbol: '$',
    usdExchangeRate: 1,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: toFlagIcon('GB'),
    locale: 'en-GB',
    languageCode: 'en',
    languageLabel: 'English',
    currencyCode: 'USD',
    currencySymbol: '$',
    usdExchangeRate: 1,
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: toFlagIcon('CA'),
    locale: 'en-CA',
    languageCode: 'en',
    languageLabel: 'English',
    currencyCode: 'USD',
    currencySymbol: '$',
    usdExchangeRate: 1,
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: toFlagIcon('AU'),
    locale: 'en-AU',
    languageCode: 'en',
    languageLabel: 'English',
    currencyCode: 'USD',
    currencySymbol: '$',
    usdExchangeRate: 1,
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: toFlagIcon('DE'),
    locale: 'de-DE',
    languageCode: 'de',
    languageLabel: 'Deutsch',
    currencyCode: 'USD',
    currencySymbol: '$',
    usdExchangeRate: 1,
  },
  {
    code: 'FR',
    name: 'France',
    flag: toFlagIcon('FR'),
    locale: 'fr-FR',
    languageCode: 'fr',
    languageLabel: 'French',
    currencyCode: 'USD',
    currencySymbol: '$',
    usdExchangeRate: 1,
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: toFlagIcon('JP'),
    locale: 'ja-JP',
    languageCode: 'ja',
    languageLabel: 'Japanese',
    currencyCode: 'USD',
    currencySymbol: '$',
    usdExchangeRate: 1,
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: toFlagIcon('SG'),
    locale: 'en-SG',
    languageCode: 'en',
    languageLabel: 'English',
    currencyCode: 'USD',
    currencySymbol: '$',
    usdExchangeRate: 1,
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: toFlagIcon('AE'),
    locale: 'ar-AE',
    languageCode: 'ar',
    languageLabel: 'Arabic',
    currencyCode: 'USD',
    currencySymbol: '$',
    usdExchangeRate: 1,
  },
];

const TRANSLATIONS: Record<SupportedLanguageCode, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.receipts': 'Receipts',
    'nav.budgets': 'Budgets',
    'nav.categories': 'Categories',
    'nav.insights': 'Insights',
    'nav.forecast': 'Forecast',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    'shell.quickAdd': 'Quick Add',
    'shell.userManual': 'User Manual',
    'shell.region': 'Country',
    'shell.notifications': 'Notifications',
    'shell.allClear': 'All clear - no active alerts',
    'shell.yourProfile': 'Your profile',
    'shell.accountSettings': 'Account settings',
    'shell.logout': 'Logout',
  },
  hi: {
    'nav.dashboard': 'डैशबोर्ड',
    'nav.receipts': 'रसीदें',
    'nav.budgets': 'बजट',
    'nav.categories': 'श्रेणियां',
    'nav.insights': 'AI इनसाइट्स',
    'nav.forecast': 'पूर्वानुमान',
    'nav.profile': 'प्रोफाइल',
    'nav.admin': 'एडमिन',
    'shell.quickAdd': 'क्विक ऐड',
    'shell.userManual': 'यूज़र मैनुअल',
    'shell.region': 'देश',
    'shell.notifications': 'सूचनाएं',
    'shell.allClear': 'सब ठीक है - कोई सक्रिय अलर्ट नहीं',
    'shell.yourProfile': 'आपकी प्रोफाइल',
    'shell.accountSettings': 'अकाउंट सेटिंग्स',
    'shell.logout': 'लॉग आउट',
  },
  de: {
    'nav.dashboard': 'Dashboard',
    'nav.receipts': 'Belege',
    'nav.budgets': 'Budgets',
    'nav.categories': 'Kategorien',
    'nav.insights': 'KI-Einblicke',
    'nav.forecast': 'Prognose',
    'nav.profile': 'Profil',
    'nav.admin': 'Admin',
    'shell.quickAdd': 'Schnell erfassen',
    'shell.userManual': 'Benutzerhandbuch',
    'shell.region': 'Land',
    'shell.notifications': 'Benachrichtigungen',
    'shell.allClear': 'Alles klar - keine aktiven Hinweise',
    'shell.yourProfile': 'Ihr Profil',
    'shell.accountSettings': 'Kontoeinstellungen',
    'shell.logout': 'Abmelden',
  },
  fr: {
    'nav.dashboard': 'Tableau de bord',
    'nav.receipts': 'Recus',
    'nav.budgets': 'Budgets',
    'nav.categories': 'Categories',
    'nav.insights': 'Insights IA',
    'nav.forecast': 'Prevision',
    'nav.profile': 'Profil',
    'nav.admin': 'Admin',
    'shell.quickAdd': 'Ajout rapide',
    'shell.userManual': 'Guide utilisateur',
    'shell.region': 'Pays',
    'shell.notifications': 'Notifications',
    'shell.allClear': 'Tout est clair - aucune alerte active',
    'shell.yourProfile': 'Votre profil',
    'shell.accountSettings': 'Parametres du compte',
    'shell.logout': 'Deconnexion',
  },
  ja: {
    'nav.dashboard': 'ダッシュボード',
    'nav.receipts': 'レシート',
    'nav.budgets': '予算',
    'nav.categories': 'カテゴリ',
    'nav.insights': 'AIインサイト',
    'nav.forecast': '予測',
    'nav.profile': 'プロフィール',
    'nav.admin': '管理',
    'shell.quickAdd': 'クイック追加',
    'shell.userManual': 'ユーザーマニュアル',
    'shell.region': '国',
    'shell.notifications': '通知',
    'shell.allClear': '現在アクティブな通知はありません',
    'shell.yourProfile': 'プロフィール',
    'shell.accountSettings': 'アカウント設定',
    'shell.logout': 'ログアウト',
  },
  ar: {
    'nav.dashboard': 'لوحة التحكم',
    'nav.receipts': 'الإيصالات',
    'nav.budgets': 'الميزانيات',
    'nav.categories': 'الفئات',
    'nav.insights': 'رؤى الذكاء الاصطناعي',
    'nav.forecast': 'التوقعات',
    'nav.profile': 'الملف الشخصي',
    'nav.admin': 'المسؤول',
    'shell.quickAdd': 'إضافة سريعة',
    'shell.userManual': 'دليل المستخدم',
    'shell.region': 'الدولة',
    'shell.notifications': 'الإشعارات',
    'shell.allClear': 'كل شيء بخير - لا توجد تنبيهات نشطة',
    'shell.yourProfile': 'ملفك الشخصي',
    'shell.accountSettings': 'إعدادات الحساب',
    'shell.logout': 'تسجيل الخروج',
  },
};

interface ParsedDigitsInfo {
  minimumIntegerDigits: number;
  minimumFractionDigits: number;
  maximumFractionDigits: number;
}

@Injectable({ providedIn: 'root' })
export class LocalePreferenceService {
  readonly supportedCountries = COUNTRY_PREFERENCES;

  private readonly preferenceSubject = new BehaviorSubject<CountryPreference>(
    this.resolveInitialPreference(),
  );

  readonly preference$ = this.preferenceSubject.asObservable();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.applyDocumentLanguage(this.preferenceSubject.value);
  }

  get currentPreference(): CountryPreference {
    return this.preferenceSubject.value;
  }

  getFlagIcon(code: SupportedCountryCode): string {
    return toFlagIcon(code);
  }

  setCountry(code: SupportedCountryCode): void {
    const nextPreference =
      COUNTRY_PREFERENCES.find((country) => country.code === code) ||
      this.currentPreference;

    if (nextPreference.code === this.currentPreference.code) {
      return;
    }

    this.preferenceSubject.next(nextPreference);
    this.persistPreference(nextPreference.code);
    this.applyDocumentLanguage(nextPreference);
  }

  translate(key: string, fallback?: string): string {
    const currentLanguage = this.currentPreference.languageCode;
    const localized = TRANSLATIONS[currentLanguage]?.[key];

    return localized || TRANSLATIONS['en'][key] || fallback || key;
  }

  convertFromBase(value: number | string | null | undefined): number {
    const numericValue = this.toNumber(value);

    if (numericValue === null) {
      return 0;
    }

    return numericValue * this.currentPreference.usdExchangeRate;
  }

  convertToBase(value: number | string | null | undefined): number {
    const numericValue = this.toNumber(value);

    if (numericValue === null) {
      return 0;
    }

    return numericValue / this.currentPreference.usdExchangeRate;
  }

  formatCurrency(
    value: number | string | null | undefined,
    digitsInfo = '1.2-2',
  ): string {
    const numericValue = this.toNumber(value);

    if (numericValue === null) {
      return '';
    }

    const digits = this.parseDigitsInfo(digitsInfo);

    return new Intl.NumberFormat(this.currentPreference.locale, {
      style: 'currency',
      currency: this.currentPreference.currencyCode,
      minimumIntegerDigits: digits.minimumIntegerDigits,
      minimumFractionDigits: digits.minimumFractionDigits,
      maximumFractionDigits: digits.maximumFractionDigits,
    }).format(this.convertFromBase(numericValue));
  }

  formatDate(
    value: string | number | Date | null | undefined,
    format: string = 'mediumDate',
  ): string {
    if (!value) {
      return '';
    }

    const date =
      value instanceof Date
        ? value
        : new Date(typeof value === 'number' ? value : String(value));

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const options = this.getDateFormatOptions(format);
    return new Intl.DateTimeFormat(this.currentPreference.locale, options).format(
      date,
    );
  }

  detectExplicitExpenseCurrency(text: string): ExpenseCurrencyCode | null {
    const normalizedText = text.toLowerCase();
    const rupeeIndex = this.findFirstMatchIndex(normalizedText, [
      /\binr\b/,
      /\brs\.?\b/,
      /\brupee\b/,
      /\brupees\b/,
      /\u20b9/,
    ]);
    const dollarIndex = this.findFirstMatchIndex(normalizedText, [
      /\busd\b/,
      /\bdollar\b/,
      /\bdollars\b/,
      /\$/,
    ]);

    if (rupeeIndex === -1 && dollarIndex === -1) {
      return null;
    }

    if (rupeeIndex !== -1 && dollarIndex === -1) {
      return 'INR';
    }

    if (dollarIndex !== -1 && rupeeIndex === -1) {
      return 'USD';
    }

    return rupeeIndex <= dollarIndex ? 'INR' : 'USD';
  }

  buildCurrencyAwareExpenseText(text: string): string {
    const explicitCurrency = this.detectExplicitExpenseCurrency(text);

    if (explicitCurrency === 'INR') {
      return `${text}\n\nCurrency note: Any amount in this sentence is written in Indian rupees (INR). Return the numeric amount from the rupee value.`;
    }

    if (explicitCurrency === 'USD') {
      return `${text}\n\nCurrency note: Any amount in this sentence is written in US dollars (USD). Return the numeric dollar amount.`;
    }

    return text;
  }

  normalizeExplicitCurrencyToBase(
    amount: number,
    currency: ExpenseCurrencyCode | null,
  ): number {
    if (currency === 'INR') {
      return amount / 94;
    }

    return amount;
  }

  private resolveInitialPreference(): CountryPreference {
    const savedCode = this.readStoredCountryCode();

    return (
      COUNTRY_PREFERENCES.find((country) => country.code === savedCode) ||
      COUNTRY_PREFERENCES.find((country) => country.code === DEFAULT_COUNTRY_CODE) ||
      COUNTRY_PREFERENCES[0]
    );
  }

  private readStoredCountryCode(): SupportedCountryCode | null {
    try {
      const storedCode = localStorage.getItem(STORAGE_KEY);
      if (!storedCode) {
        return null;
      }

      return storedCode as SupportedCountryCode;
    } catch {
      return null;
    }
  }

  private persistPreference(code: SupportedCountryCode): void {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      return;
    }
  }

  private applyDocumentLanguage(preference: CountryPreference): void {
    this.document.documentElement.lang = preference.locale;
  }

  private toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue =
      typeof value === 'number' ? value : Number.parseFloat(String(value));

    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private parseDigitsInfo(digitsInfo: string): ParsedDigitsInfo {
    const match = /^(\d+)\.(\d+)-(\d+)$/.exec(digitsInfo);

    if (!match) {
      return {
        minimumIntegerDigits: 1,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      };
    }

    return {
      minimumIntegerDigits: Number(match[1]),
      minimumFractionDigits: Number(match[2]),
      maximumFractionDigits: Number(match[3]),
    };
  }

  private findFirstMatchIndex(text: string, patterns: RegExp[]): number {
    const indices = patterns
      .map((pattern) => text.search(pattern))
      .filter((index) => index >= 0);

    return indices.length ? Math.min(...indices) : -1;
  }

  private getDateFormatOptions(format: string): Intl.DateTimeFormatOptions {
    switch (format) {
      case 'short':
        return {
          dateStyle: 'short',
          timeStyle: 'short',
        };
      case 'shortTime':
        return {
          timeStyle: 'short',
        };
      case 'd':
        return {
          day: 'numeric',
        };
      case 'MMM d':
        return {
          month: 'short',
          day: 'numeric',
        };
      case 'mediumDate':
      default:
        return {
          dateStyle: 'medium',
        };
    }
  }
}
