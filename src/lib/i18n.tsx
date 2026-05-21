import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "ar";

const dict = {
  fr: {
    "app.name": "StudyAbroad",
    "auth.login": "Connexion",
    "auth.email": "Email",
    "auth.password": "Mot de passe",
    "auth.newPassword": "Nouveau mot de passe",
    "auth.confirmPassword": "Confirmer le mot de passe",
    "auth.signIn": "Se connecter",
    "auth.updatePassword": "Mettre à jour le mot de passe",
    "auth.logout": "Déconnexion",
    "auth.firstLogin": "Première connexion — veuillez définir votre mot de passe",
    "nav.back": "Retour",
    "nav.forward": "Suivant",
    "nav.home": "Accueil",
    "nav.notifications": "Notifications",
    "nav.menu": "Menu",
    "fab.chat": "Discussion",
    "fab.ai": "Assistant IA",
    "home.greeting": "Bonjour",
    "home.progress": "{pct}% terminé — {done} sur {total} étapes",
    "step.locked": "Étape verrouillée",
    "step.active": "En cours",
    "step.completed": "Terminée",
    "step.1": "Mes informations",
    "step.2": "Mes documents",
    "step.3": "Universités",
    "step.4": "Suivi des candidatures",
    "step.5": "Admission & Paiement",
    "step.6": "Visa",
    "step.7": "Départ",
    "doc.mandatory": "Obligatoires",
    "doc.optional": "Optionnels",
    "doc.status.pending": "En attente",
    "doc.status.approved": "Approuvé",
    "doc.status.rejected": "Rejeté",
    "doc.upload": "Téléverser",
    "uni.maxSelect": "Max. 5 universités",
    "uni.select": "Sélectionner",
    "uni.selected": "Sélectionnée",
    "uni.ranking": "Classement",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.approve": "Approuver",
    "common.reject": "Rejeter",
    "common.next": "Suivant",
    "common.prev": "Précédent",
    "common.submit": "Soumettre",
    "common.loading": "Chargement...",
    "crm.dashboard": "Tableau de bord",
    "crm.students": "Étudiants",
    "crm.validation": "Validation",
    "crm.universities": "Universités",
    "crm.invite": "Inviter",
    "crm.branding": "Image de marque",
    "crm.kpi.students": "Total étudiants",
    "crm.kpi.pending": "Validations en attente",
    "crm.kpi.visas": "Visas à venir",
    "lang.fr": "Français",
    "lang.ar": "العربية",
  },
  ar: {
    "app.name": "StudyAbroad",
    "auth.login": "تسجيل الدخول",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.newPassword": "كلمة مرور جديدة",
    "auth.confirmPassword": "تأكيد كلمة المرور",
    "auth.signIn": "دخول",
    "auth.updatePassword": "تحديث كلمة المرور",
    "auth.logout": "تسجيل الخروج",
    "auth.firstLogin": "أول تسجيل دخول — يرجى تعيين كلمة المرور",
    "nav.back": "رجوع",
    "nav.forward": "التالي",
    "nav.home": "الرئيسية",
    "nav.notifications": "الإشعارات",
    "nav.menu": "القائمة",
    "fab.chat": "محادثة",
    "fab.ai": "مساعد الذكاء",
    "home.greeting": "مرحباً",
    "home.progress": "{pct}% مكتمل — {done} من {total} خطوات",
    "step.locked": "خطوة مقفلة",
    "step.active": "قيد التنفيذ",
    "step.completed": "مكتملة",
    "step.1": "معلوماتي",
    "step.2": "مستنداتي",
    "step.3": "الجامعات",
    "step.4": "متابعة الطلبات",
    "step.5": "القبول والدفع",
    "step.6": "التأشيرة",
    "step.7": "المغادرة",
    "doc.mandatory": "إلزامية",
    "doc.optional": "اختيارية",
    "doc.status.pending": "قيد المراجعة",
    "doc.status.approved": "مقبول",
    "doc.status.rejected": "مرفوض",
    "doc.upload": "رفع",
    "uni.maxSelect": "حد أقصى 5 جامعات",
    "uni.select": "اختيار",
    "uni.selected": "مختارة",
    "uni.ranking": "الترتيب",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.approve": "موافقة",
    "common.reject": "رفض",
    "common.next": "التالي",
    "common.prev": "السابق",
    "common.submit": "إرسال",
    "common.loading": "جار التحميل...",
    "crm.dashboard": "لوحة التحكم",
    "crm.students": "الطلاب",
    "crm.validation": "التحقق",
    "crm.universities": "الجامعات",
    "crm.invite": "دعوة",
    "crm.branding": "العلامة التجارية",
    "crm.kpi.students": "إجمالي الطلاب",
    "crm.kpi.pending": "بانتظار المراجعة",
    "crm.kpi.visas": "تأشيرات قادمة",
    "lang.fr": "Français",
    "lang.ar": "العربية",
  },
} as const;

type Key = keyof typeof dict.fr;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "fr";
    return (localStorage.getItem("lang") as Lang) || "fr";
  });

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (key: Key, vars?: Record<string, string | number>) => {
    let s: string = (dict[lang] as Record<string, string>)[key] ?? (dict.fr as Record<string, string>)[key] ?? key;
    if (vars) for (const k in vars) s = s.replace(`{${k}}`, String(vars[k]));
    return s;
  };

  return <Ctx.Provider value={{ lang, setLang, t, dir }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside I18nProvider");
  return c;
}
