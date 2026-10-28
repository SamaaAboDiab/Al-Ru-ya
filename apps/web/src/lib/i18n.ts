import { DEFAULT_LOCALE, LOCALES, type ErrorCode, type Locale } from '@ruya/shared';

export const LOCALE_COOKIE = 'ruya_lang';

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export const dir = (locale: Locale) => (locale === 'ar' ? 'rtl' : 'ltr');

/** US-16: dates and numbers follow the chosen language. */
export function formatDate(isoDate: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatNumber(n: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(n);
}

/** Arabic counts change form with the number: سنة، سنتين، ٣ سنين، ١١ سنة. */
function arabicYears(n: number) {
  const digits = formatNumber(n, 'ar');
  switch (new Intl.PluralRules('ar').select(n)) {
    case 'one':
      return 'سنة';
    case 'two':
      return 'سنتين';
    case 'few':
      return `${digits} سنين`;
    default:
      return `${digits} سنة`;
  }
}

const ar = {
  appName: 'الرؤية',
  tagline: 'تنظيم زيارات الأطفال وجدولهم، بهدوء ووضوح.',
  switchLanguage: 'English',
  nav: { logout: 'خروج' },
  login: {
    title: 'تسجيل الدخول',
    subtitle: 'ادخل بالإيميل والباسورد بتوعك.',
    submit: 'دخول',
    noAccount: 'معندكش حساب؟',
    toRegister: 'سجّل كأب أو أم',
  },
  register: {
    title: 'حساب جديد للأهل',
    subtitle: 'الحساب ده للأب أو الأم. حساب الطفل بيتعمل من صفحتك بعد كده.',
    submit: 'إنشاء الحساب',
    haveAccount: 'عندك حساب؟',
    toLogin: 'ادخل',
  },
  fields: {
    name: 'الاسم',
    email: 'الإيميل',
    password: 'الباسورد',
    passwordHint: '٨ حروف أو أرقام على الأقل.',
    role: 'أنا',
    mother: 'أم',
    father: 'أب',
    childName: 'اسم الطفل',
    birthDate: 'تاريخ الميلاد',
  },
  parent: {
    greeting: (name: string) => `أهلاً يا ${name}`,
    childrenTitle: 'أولادك',
    noChildren: 'لسه ما ضفتش أي طفل. ابدأ بإضافة طفلك.',
    addChildTitle: 'إضافة طفل',
    addChild: 'إضافة الطفل',
    age: (n: number) => `السن: ${arabicYears(n)}`,
    hasAccount: 'عنده حساب بيدخل بيه',
    managedByParents: 'أصغر من ١٠ سنين، فملفه بيديره الأهل.',
    createAccountTitle: 'حساب دخول للطفل',
    createAccount: 'إنشاء حساب الطفل',
    accountCreated: 'اتعمل حساب الطفل. ادّيله الإيميل والباسورد عشان يدخل.',
  },
  child: {
    greeting: (name: string) => `أهلاً يا ${name}`,
    intro: 'دي صفحتك. هنا هتعمل جدولك وتسجل يومك وزياراتك قريب.',
  },
  forbidden: {
    title: 'مفيش صلاحية',
    body: 'الصفحة دي مش متاحة لحسابك.',
    back: 'ارجع لصفحتك',
  },
  errors: {
    VALIDATION_FAILED: 'راجع البيانات اللي تحت.',
    EMAIL_TAKEN: 'الإيميل ده متسجل قبل كده. جرّب تدخل بيه أو استخدم إيميل تاني.',
    INVALID_CREDENTIALS: 'الإيميل أو الباسورد غلط.',
    UNAUTHENTICATED: 'لازم تدخل الأول.',
    FORBIDDEN: 'مفيش صلاحية.',
    NOT_FOUND: 'مش لاقيين اللي بتدور عليه.',
    CHILD_TOO_YOUNG: 'حساب الطفل بيتعمل من سن ١٠ سنين. لحد كده ملفه بيديره الأهل.',
    CHILD_ACCOUNT_EXISTS: 'الطفل ده عنده حساب بالفعل.',
    TOO_MANY_REQUESTS: 'محاولات كتير. استنى شوية وجرّب تاني.',
    INTERNAL: 'حصلت مشكلة عندنا. جرّب تاني بعد شوية.',
    NETWORK: 'مش قادرين نوصل للسيرفر. اتأكد من النت وجرّب تاني.',
  } satisfies Record<ErrorCode | 'NETWORK', string>,
  fieldErrors: {
    EMAIL_INVALID: 'اكتب إيميل صحيح، زي name@example.com.',
    PASSWORD_TOO_SHORT: 'الباسورد لازم يكون ٨ حروف أو أرقام على الأقل.',
    PASSWORD_TOO_LONG: 'الباسورد طويل أوي.',
    PASSWORD_REQUIRED: 'اكتب الباسورد.',
    NAME_REQUIRED: 'اكتب الاسم.',
    NAME_TOO_LONG: 'الاسم طويل أوي.',
    ROLE_REQUIRED: 'اختار أم أو أب.',
    DATE_INVALID: 'اختار تاريخ صحيح.',
    DATE_IN_FUTURE: 'تاريخ الميلاد ما ينفعش يكون في المستقبل.',
  } as Record<string, string>,
};

export type Dictionary = typeof ar;

const en: Dictionary = {
  appName: 'Al-Ruya',
  tagline: "Organize children's visits and schedules, calmly and clearly.",
  switchLanguage: 'العربية',
  nav: { logout: 'Sign out' },
  login: {
    title: 'Sign in',
    subtitle: 'Use your email and password.',
    submit: 'Sign in',
    noAccount: "Don't have an account?",
    toRegister: 'Register as a parent',
  },
  register: {
    title: 'New parent account',
    subtitle: "This account is for a mother or father. You'll create your child's login from your page.",
    submit: 'Create account',
    haveAccount: 'Already have an account?',
    toLogin: 'Sign in',
  },
  fields: {
    name: 'Name',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 8 characters.',
    role: 'I am the',
    mother: 'Mother',
    father: 'Father',
    childName: "Child's name",
    birthDate: 'Date of birth',
  },
  parent: {
    greeting: (name) => `Hello, ${name}`,
    childrenTitle: 'Your children',
    noChildren: "You haven't added a child yet. Start by adding your child.",
    addChildTitle: 'Add a child',
    addChild: 'Add child',
    age: (n) => `Age: ${formatNumber(n, 'en')}`,
    hasAccount: 'Has their own login',
    managedByParents: 'Under 10, so parents manage this profile.',
    createAccountTitle: "Child's login",
    createAccount: 'Create child account',
    accountCreated: 'Account created. Give your child the email and password to sign in.',
  },
  child: {
    greeting: (name) => `Hi, ${name}`,
    intro: "This is your page. Soon you'll build your schedule and log your day and visits here.",
  },
  forbidden: {
    title: 'No permission',
    body: "This page isn't available for your account.",
    back: 'Back to your page',
  },
  errors: {
    VALIDATION_FAILED: 'Please check the details below.',
    EMAIL_TAKEN: 'This email is already registered. Sign in with it or use another email.',
    INVALID_CREDENTIALS: 'Wrong email or password.',
    UNAUTHENTICATED: 'Please sign in first.',
    FORBIDDEN: 'No permission.',
    NOT_FOUND: "We couldn't find that.",
    CHILD_TOO_YOUNG: 'A child account can be created from age 10. Until then, parents manage the profile.',
    CHILD_ACCOUNT_EXISTS: 'This child already has an account.',
    TOO_MANY_REQUESTS: 'Too many attempts. Wait a bit and try again.',
    INTERNAL: 'Something went wrong on our side. Try again shortly.',
    NETWORK: "We can't reach the server. Check your connection and try again.",
  },
  fieldErrors: {
    EMAIL_INVALID: 'Enter a valid email, like name@example.com.',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
    PASSWORD_TOO_LONG: 'Password is too long.',
    PASSWORD_REQUIRED: 'Enter your password.',
    NAME_REQUIRED: 'Enter a name.',
    NAME_TOO_LONG: 'Name is too long.',
    ROLE_REQUIRED: 'Choose mother or father.',
    DATE_INVALID: 'Choose a valid date.',
    DATE_IN_FUTURE: "Date of birth can't be in the future.",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { ar, en };
