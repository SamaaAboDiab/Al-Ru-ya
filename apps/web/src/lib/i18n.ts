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
  appSubtitle: 'Al-Ru’ya',
  tagline: 'تنظيم زيارات الأطفال وجدولهم، بهدوء ووضوح.',
  switchLanguage: 'English',
  welcome: {
    tagline: 'لأن كل طفل يستاهل يتشاف، وكل أب وأم يستاهلوا فرصة.',
    loading: 'بنجهّز لك التطبيق…',
    createAccount: 'إنشاء حساب',
    signIn: 'تسجيل الدخول',
  },
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
    linkedParents: 'الأهل المربوطين:',
    inviteTitle: 'ادعُ الطرف التاني',
    inviteHint: 'هنبعتله إيميل فيه لينك يربط حسابه بالطفل. اللينك صالح ٧ أيام.',
    inviteEmail: 'إيميل الطرف التاني',
    sendInvite: 'ابعت الدعوة',
    inviteSent: (email: string) => `اتبعتت دعوة لـ ${email}. تقدر كمان تبعتله اللينك ده بنفسك:`,
    copyLink: 'انسخ اللينك',
    copied: 'اتنسخ',
    pendingInvite: (email: string, until: string) => `في دعوة مستنية لـ ${email} لحد ${until}.`,
  },
  invitePage: {
    title: (inviter: string, child: string) => `${inviter} بيدعوك تتابع ${child}`,
    body: 'لما تقبل، هتشوف جدول الطفل ويومياته وزياراته من حسابك.',
    sentTo: 'الدعوة مبعوتة لـ',
    validUntil: 'صالحة لحد',
    accept: 'اقبل الدعوة',
    createAccount: 'إنشاء حساب بالإيميل ده',
    signIn: 'عندي حساب، هدخل',
    wrongAccount: (current: string, invited: string) =>
      `انت داخل بـ ${current}، والدعوة مبعوتة لـ ${invited}. اخرج وادخل بالإيميل اللي اتبعتتله الدعوة.`,
    childAccount: 'الدعوات دي للأهل بس، مش لحسابات الأطفال.',
    invalidTitle: 'اللينك ده مش شغال',
    invalid: 'اتأكد إنك نسخت اللينك كله، أو اطلب دعوة جديدة.',
    expired: (inviter: string) => `الدعوة دي انتهت. اطلب من ${inviter} يبعتلك دعوة جديدة.`,
    used: 'الدعوة دي اتستخدمت أو اتلغت.',
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
    INVITE_NOT_FOUND: 'الدعوة دي مش موجودة.',
    INVITE_EXPIRED: 'الدعوة دي انتهت. اطلب دعوة جديدة.',
    INVITE_USED: 'الدعوة دي اتستخدمت أو اتلغت.',
    INVITE_EMAIL_MISMATCH: 'الدعوة دي مبعوتة لإيميل تاني.',
    CANNOT_INVITE_SELF: 'ما ينفعش تبعت دعوة لنفسك. اكتب إيميل الطرف التاني.',
    ALREADY_LINKED: 'الشخص ده مربوط بالطفل بالفعل.',
    CHILD_HAS_BOTH_PARENTS: 'الأب والأم الاتنين مربوطين بالطفل بالفعل.',
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
  appName: 'Al-Ru’ya',
  appSubtitle: 'The Vision',
  tagline: "Organize children's visits and schedules, calmly and clearly.",
  switchLanguage: 'العربية',
  welcome: {
    tagline: 'Because every child deserves to be seen, and every parent deserves a chance.',
    loading: 'Getting things ready…',
    createAccount: 'Create account',
    signIn: 'Sign in',
  },
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
    linkedParents: 'Linked parents:',
    inviteTitle: 'Invite the other parent',
    inviteHint: "We'll email them a link to connect their account to this child. The link works for 7 days.",
    inviteEmail: "Other parent's email",
    sendInvite: 'Send invitation',
    inviteSent: (email) => `Invitation sent to ${email}. You can also send them this link yourself:`,
    copyLink: 'Copy link',
    copied: 'Copied',
    pendingInvite: (email, until) => `Invitation to ${email} is waiting until ${until}.`,
  },
  invitePage: {
    title: (inviter, child) => `${inviter} invited you to follow ${child}`,
    body: "Once you accept, you'll see the child's schedule, daily log and visits from your account.",
    sentTo: 'Sent to',
    validUntil: 'Valid until',
    accept: 'Accept invitation',
    createAccount: 'Create an account with this email',
    signIn: 'I have an account, sign in',
    wrongAccount: (current, invited) =>
      `You're signed in as ${current}, but this invitation was sent to ${invited}. Sign out and sign in with the invited email.`,
    childAccount: "Invitations are for parents only, not children's accounts.",
    invalidTitle: "This link doesn't work",
    invalid: 'Make sure you copied the whole link, or ask for a new invitation.',
    expired: (inviter) => `This invitation has expired. Ask ${inviter} to send a new one.`,
    used: 'This invitation was already used or cancelled.',
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
    INVITE_NOT_FOUND: "This invitation doesn't exist.",
    INVITE_EXPIRED: 'This invitation has expired. Ask for a new one.',
    INVITE_USED: 'This invitation was already used or cancelled.',
    INVITE_EMAIL_MISMATCH: 'This invitation was sent to a different email.',
    CANNOT_INVITE_SELF: "You can't invite yourself. Enter the other parent's email.",
    ALREADY_LINKED: 'This person is already linked to the child.',
    CHILD_HAS_BOTH_PARENTS: 'Both parents are already linked to this child.',
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
