import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileText,
  LockKeyhole,
  Scale,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

export const primaryCta = {
  label: "Iniciar analisis",
  href: "/iniciar",
};

export const secondaryCta = {
  label: "Ver como funciona",
  href: "/como-funciona",
};

export const benefits = [
  {
    title: "Ruta guiada",
    description:
      "Te mostramos que hacer en cada paso para crear tu expediente sin cargar datos sensibles en publico.",
    icon: ClipboardCheck,
  },
  {
    title: "Hallazgos claros",
    description:
      "Organizamos documentos y senales de riesgo para que entiendas donde puede haber inconsistencias.",
    icon: FileSearch,
  },
  {
    title: "Alcance verificable",
    description:
      "La IA ayuda a ordenar informacion, pero las conclusiones relevantes se apoyan en reglas y revision humana.",
    icon: ShieldCheck,
  },
];

export const processSteps = [
  {
    title: "Registro",
    description: "Crea tu cuenta para iniciar un expediente seguro.",
    icon: BadgeCheck,
  },
  {
    title: "Consentimiento",
    description: "Acepta las autorizaciones antes de tratar datos sensibles.",
    icon: LockKeyhole,
  },
  {
    title: "Expediente",
    description: "Indica el tipo de analisis laboral o pensional que necesitas.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Documentos",
    description: "Carga soportes dentro del flujo privado, no en la landing publica.",
    icon: FileText,
  },
  {
    title: "Preanalisis",
    description: "Recibe orientacion preliminar y una vista previa bloqueada.",
    icon: Bot,
  },
  {
    title: "Pago al final",
    description: "Solo despues de la vista previa desbloqueas el analisis completo.",
    icon: WalletCards,
  },
  {
    title: "Informe",
    description: "Accede a informe, recomendaciones y escritos cuando aplique.",
    icon: Scale,
  },
];

export const serviceCards = [
  {
    title: "Historia laboral",
    description:
      "Organiza semanas, periodos y posibles vacios para una revision mas ordenada.",
    icon: FileSearch,
  },
  {
    title: "Pension de vejez",
    description:
      "Entiende si la informacion disponible permite avanzar hacia un analisis tecnico.",
    icon: CheckCircle2,
  },
  {
    title: "Reliquidacion",
    description:
      "Identifica senales que pueden requerir comparacion de datos y validacion profesional.",
    icon: Scale,
  },
  {
    title: "Semanas faltantes",
    description:
      "Detecta inconsistencias preliminares sin prometer un resultado juridico favorable.",
    icon: Sparkles,
  },
];

export const trustItems = [
  "No pedimos documentos en formularios publicos.",
  "El tratamiento de datos sensibles empieza con consentimiento.",
  "El expediente conserva trazabilidad de pasos y decisiones.",
  "La IA asistida no reemplaza revision juridica profesional.",
];

export const pricingIncluded = [
  "Inicio de expediente y orientacion preliminar.",
  "Organizacion documental dentro del flujo seguro.",
  "Vista previa bloqueada antes de pagar.",
  "Analisis completo, informe y escritos despues del pago.",
];

export const pricingNotIncluded = [
  "No incluye promesa de resultado favorable.",
  "No genera demandas automaticas sin validacion.",
  "No reemplaza asesoria personalizada antes de crear expediente.",
  "No solicita documentos sensibles desde la landing publica.",
];

export const faqItems = [
  {
    category: "servicio",
    question: "Que hace Labora?",
    answer:
      "Labora guia la creacion de un expediente laboral o pensional, organiza informacion y ayuda a identificar posibles inconsistencias para una revision posterior.",
  },
  {
    category: "documentos",
    question: "Puedo subir documentos desde la landing?",
    answer:
      "No. La carga documental ocurre dentro del expediente seguro, despues de crear cuenta y aceptar las autorizaciones correspondientes.",
  },
  {
    category: "ia",
    question: "La IA decide mi caso?",
    answer:
      "No. La IA asistida organiza informacion y acelera revisiones, pero las decisiones relevantes deben apoyarse en reglas verificables y revision humana cuando aplique.",
  },
  {
    category: "privacidad",
    question: "Que datos pide el formulario publico?",
    answer:
      "Solo datos de contacto basicos. No debes enviar historia laboral, documentos, salarios ni informacion sensible por el formulario publico.",
  },
  {
    category: "precio",
    question: "Cuando pago?",
    answer:
      "El pago ocurre despues del preanalisis y de una vista previa bloqueada. La landing no envia directamente a checkout.",
  },
  {
    category: "proceso",
    question: "Que pasa despues de iniciar?",
    answer:
      "Creas tu cuenta, aceptas consentimientos, creas un expediente, cargas documentos y recibes una orientacion preliminar antes de decidir si desbloqueas el analisis completo.",
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
  { value: "", label: "Selecciona una opcion" },
  { value: "historia_laboral", label: "Historia laboral" },
  { value: "pension_vejez", label: "Pension de vejez" },
  { value: "reliquidacion", label: "Reliquidacion" },
  { value: "semanas_faltantes", label: "Semanas faltantes" },
  { value: "regimen_especial", label: "Regimen especial" },
  { value: "docente_magisterio", label: "Docente / magisterio" },
  { value: "otro", label: "Otro" },
];

export const arrowIcon = ArrowRight;
