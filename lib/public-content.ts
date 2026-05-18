import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileText,
  Info,
  Scale,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

export const landingCopy = {
  header: {
    support: "Tu revisión laboral, paso a paso y sin complicaciones.",
    loginCta: "Entrar a mi cuenta",
    primaryCta: "Empezar ahora",
  },
  hero: {
    eyebrow: "Revisión laboral clara",
    title: "Revisa tu historia laboral de forma clara y sencilla.",
    subtitle:
      "Te guiamos paso a paso para que entiendas tu información sin palabras difíciles.",
    primaryCta: "Empezar mi revisión",
    secondaryCta: "Ver cómo funciona",
  },
  serviceDescription: {
    paragraphs: [
      "Labora ordena tus documentos y revisa tu información laboral para mostrarte, de forma fácil, si hay errores, datos que no coinciden o cosas que debes revisar.",
      "Así entiendes tu caso con más tranquilidad y sin enredos.",
    ],
  },
  howItWorks: {
    title: "¿Cómo funciona?",
    description:
      "Tres pasos simples para ordenar tu información, revisar posibles errores y entender qué conviene mirar con más atención.",
    steps: [
      {
        title: "Reunimos y ordenamos tu historia laboral.",
        description:
          "Tomamos tus documentos y los ponemos en orden para ver toda tu información más clara.",
      },
      {
        title: "Buscamos posibles errores o datos faltantes.",
        description:
          "Revisamos si hay periodos sin registrar, diferencias entre documentos o información que no coincide.",
      },
      {
        title: "Te entregamos un informe fácil de revisar.",
        description:
          "Recibes un resumen claro con lo importante y lo que conviene mirar con más atención.",
      },
    ],
  },
  documents: {
    title: "Documentos que puedes usar",
    description:
      "Puedes subir tu historia laboral, tu cédula, certificaciones y resoluciones.",
  },
  price: {
    title: "Precio claro desde el principio",
    description:
      "Antes de pagar verás el valor del servicio, para que decidas con tranquilidad y sin sorpresas.",
  },
  importantNotice: {
    title: "Importante",
    description:
      "Esta herramienta te ayuda a ordenar y revisar tu información. En algunos casos, puede ser recomendable que un profesional revise el resultado.",
  },
};

export const primaryCta = {
  label: landingCopy.hero.primaryCta,
  href: "/iniciar",
};

export const secondaryCta = {
  label: landingCopy.hero.secondaryCta,
  href: "/#como-funciona",
};

export const benefits = [
  {
    title: landingCopy.documents.title,
    description: landingCopy.documents.description,
    icon: FileText,
  },
  {
    title: landingCopy.price.title,
    description: landingCopy.price.description,
    icon: WalletCards,
  },
  {
    title: landingCopy.importantNotice.title,
    description: landingCopy.importantNotice.description,
    icon: Info,
  },
];

export const processSteps = [
  {
    title: landingCopy.howItWorks.steps[0].title,
    description: landingCopy.howItWorks.steps[0].description,
    icon: FileText,
  },
  {
    title: landingCopy.howItWorks.steps[1].title,
    description: landingCopy.howItWorks.steps[1].description,
    icon: FileSearch,
  },
  {
    title: landingCopy.howItWorks.steps[2].title,
    description: landingCopy.howItWorks.steps[2].description,
    icon: ClipboardCheck,
  },
];

export const serviceCards = [
  {
    title: "Historia laboral",
    description:
      "Ordena semanas, periodos y posibles vacíos para una revisión más tranquila.",
    icon: FileSearch,
  },
  {
    title: "Pensión de vejez",
    description:
      "Entiende si la información disponible permite revisar el siguiente paso.",
    icon: CheckCircle2,
  },
  {
    title: "Reliquidación",
    description:
      "Identifica datos que pueden requerir comparación y revisión profesional.",
    icon: Scale,
  },
  {
    title: "Semanas faltantes",
    description:
      "Revisa periodos sin registrar o información que no coincide entre documentos.",
    icon: ClipboardCheck,
  },
];

export const trustItems = [
  "No pedimos documentos en formularios públicos.",
  "El tratamiento de datos sensibles empieza con consentimiento.",
  "El expediente conserva trazabilidad de pasos y decisiones.",
  "La revisión asistida no reemplaza una revisión profesional cuando aplique.",
];

export const pricingIncluded = [
  "Inicio de expediente y orientación preliminar.",
  "Organización documental dentro del flujo seguro.",
  "Vista previa bloqueada antes de pagar.",
  "Análisis completo, informe y escritos después del pago.",
];

export const pricingNotIncluded = [
  "No incluye promesa de resultado favorable.",
  "No genera demandas automáticas sin validación.",
  "No reemplaza asesoría personalizada antes de crear expediente.",
  "No solicita documentos sensibles desde la landing pública.",
];

export const faqItems = [
  {
    category: "servicio",
    question: "¿Qué hace Labora?",
    answer:
      "Labora guía la creación de un expediente laboral o pensional, ordena información y ayuda a identificar posibles errores para una revisión posterior.",
  },
  {
    category: "documentos",
    question: "¿Puedo subir documentos desde la landing?",
    answer:
      "No. La carga documental ocurre dentro del expediente seguro, después de crear cuenta y aceptar las autorizaciones correspondientes.",
  },
  {
    category: "ia",
    question: "¿La IA decide mi caso?",
    answer:
      "No. La revisión asistida organiza información y acelera revisiones, pero las decisiones relevantes deben apoyarse en reglas verificables y revisión humana cuando aplique.",
  },
  {
    category: "privacidad",
    question: "¿Qué datos pide el formulario público?",
    answer:
      "Solo datos de contacto básicos. No debes enviar historia laboral, documentos, salarios ni información sensible por el formulario público.",
  },
  {
    category: "precio",
    question: "¿Cuándo pago?",
    answer:
      "El pago ocurre después del preanálisis y de una vista previa bloqueada. La landing no envía directamente a checkout.",
  },
  {
    category: "proceso",
    question: "¿Qué pasa después de iniciar?",
    answer:
      "Creas tu cuenta, aceptas consentimientos, abres un expediente, cargas documentos y recibes una orientación preliminar antes de decidir si desbloqueas el análisis completo.",
  },
];

export const faqCategories = [
  "todos",
  "servicio",
  "documentos",
  "ia",
  "privacidad",
  "precio",
  "proceso",
];

export const leadInterestOptions = [
  { value: "", label: "Selecciona una opción" },
  { value: "historia_laboral", label: "Historia laboral" },
  { value: "pension_vejez", label: "Pensión de vejez" },
  { value: "reliquidacion", label: "Reliquidación" },
  { value: "semanas_faltantes", label: "Semanas faltantes" },
  { value: "regimen_especial", label: "Régimen especial" },
  { value: "docente_magisterio", label: "Docente / magisterio" },
  { value: "otro", label: "Otro" },
];

export const arrowIcon = ArrowRight;
