"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FileQuestion,
  FileText,
  Loader2,
  Lock,
  Pencil,
  RefreshCcw,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  AdminQuestionnaireDecisionPayload,
  CaseProfilePreview,
  Question,
  QuestionnaireResponse,
  QuestionnaireSection,
  QuestionnaireStatus,
  QuestionnaireWarning,
  SubmitQuestionnaireResponse,
} from "@/src/modules/questionnaire/api/questionnaire.types";
import {
  collectInitialAnswers,
  formatAnswerValue,
  getCriticalAnsweredQuestions,
  getSectionProgress,
  isEmptyAnswer,
  type QuestionnaireAnswers,
  type QuestionnaireFieldErrors,
} from "@/src/modules/questionnaire/utils/questionnaire-utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const statusLabels: Record<QuestionnaireStatus, string> = {
  not_started: "Sin iniciar",
  in_progress: "En progreso",
  completed: "Completado",
  blocked: "Bloqueado",
  requires_review: "Requiere revision",
  error: "Con error",
};

const statusClasses: Record<QuestionnaireStatus, string> = {
  not_started: "border-labora-ui bg-labora-ivory text-labora-deep",
  in_progress: "border-labora-mint bg-labora-mint/20 text-labora-deep",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  blocked: "border-amber-200 bg-amber-50 text-amber-800",
  requires_review: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-700",
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Fecha registrada por el sistema";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({ status }: { status: QuestionnaireStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        statusClasses[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function SaveStatusIndicator({
  status,
  error,
}: {
  status: SaveStatus;
  error?: string | null;
}) {
  const content = {
    idle: {
      icon: Save,
      label: "Sin cambios pendientes",
      className: "text-labora-gray",
    },
    saving: {
      icon: Loader2,
      label: "Guardando...",
      className: "text-labora-deep",
    },
    saved: {
      icon: CheckCircle2,
      label: "Cambios guardados",
      className: "text-emerald-700",
    },
    error: {
      icon: CircleAlert,
      label: error || "No se pudo guardar",
      className: "text-red-700",
    },
  }[status];
  const Icon = content.icon;

  return (
    <div className={cn("inline-flex items-center gap-2 text-xs font-semibold", content.className)}>
      <Icon
        className={cn("h-4 w-4", status === "saving" && "animate-spin")}
        aria-hidden="true"
      />
      {content.label}
    </div>
  );
}

export function QuestionnaireSkeleton() {
  return (
    <section className="space-y-5 pb-20 md:pb-0">
      <div className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="h-5 w-48 animate-pulse rounded bg-labora-ui" />
        <div className="mt-5 h-4 w-full animate-pulse rounded bg-labora-ui" />
        <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-labora-ui" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <div className="hidden rounded-2xl border border-labora-ui bg-white p-5 shadow-panel xl:block">
          <div className="h-5 w-28 animate-pulse rounded bg-labora-ui" />
          <div className="mt-5 space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-11 animate-pulse rounded-lg bg-labora-ui" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel"
            >
              <div className="h-4 w-32 animate-pulse rounded bg-labora-ui" />
              <div className="mt-4 h-5 w-4/5 animate-pulse rounded bg-labora-ui" />
              <div className="mt-5 h-11 w-full animate-pulse rounded bg-labora-ui" />
            </div>
          ))}
        </div>
        <div className="hidden rounded-2xl border border-labora-ui bg-white p-5 shadow-panel xl:block">
          <div className="h-5 w-36 animate-pulse rounded bg-labora-ui" />
          <div className="mt-5 h-24 animate-pulse rounded-lg bg-labora-ui" />
        </div>
      </div>
    </section>
  );
}

export function QuestionnaireErrorState({
  message,
  onRetry,
  href,
}: {
  message: string;
  onRetry?: () => void;
  href?: string;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
          <CircleAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-xl font-semibold">No pudimos cargar el cuestionario</h1>
          <p className="mt-2 text-sm leading-6">{message}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Reintentar
              </button>
            ) : null}
            {href ? (
              <Link
                href={href}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700"
              >
                Continuar
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function QuestionnaireBlockedState({
  message,
  caseId,
}: {
  message?: string;
  caseId: string;
}) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-heading text-xl font-semibold">
            Antes de continuar necesitamos completar un paso previo
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            {message ||
              "Puede faltar una autorizacion, el expediente puede estar bloqueado o tu sesion no tiene permisos para modificarlo."}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app/onboarding/consentimientos"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-deep px-4 py-2 text-sm font-semibold text-white"
            >
              Ir a consentimientos
            </Link>
            <Link
              href={`/app/cases/${caseId}`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900"
            >
              Volver al expediente
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function QuestionnaireIntroState({
  onStart,
  isStarting,
}: {
  onStart: () => void;
  isStarting: boolean;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Cuestionario guiado
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
            Completa el cuestionario guiado
          </h1>
          <p className="mt-3 text-sm leading-6 text-labora-gray">
            Responder estas preguntas nos ayudara a identificar senales de semanas faltantes,
            regimen especial, docencia, servicio publico o reliquidacion.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <NoticeRow icon={ShieldCheck}>
              La informacion laboral, pensional o salarial se tratara como informacion sensible.
            </NoticeRow>
            <NoticeRow icon={Bot}>
              Algunas preguntas pueden adaptarse con apoyo de IA segun tus respuestas y documentos.
            </NoticeRow>
          </div>
        </div>
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white shadow-panel transition hover:bg-labora-deep disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isStarting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Empezar cuestionario
        </button>
      </div>
    </section>
  );
}

function NoticeRow({
  icon: Icon,
  children,
}: {
  icon: typeof ShieldCheck;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function QuestionnaireHeader({
  status,
  completionPercentage,
  isRefreshing,
  saveStatus,
  saveError,
}: {
  status: QuestionnaireStatus;
  completionPercentage: number;
  isRefreshing: boolean;
  saveStatus: SaveStatus;
  saveError?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            {isRefreshing ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-labora-ui bg-labora-ivory px-3 py-1 text-xs font-semibold text-labora-gray">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Actualizando
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
            Cuestionario guiado del caso
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
            Estas preguntas nos ayudan a entender detalles que no siempre aparecen claramente
            en los documentos. Tus respuestas alimentaran el perfil preliminar del caso.
          </p>
        </div>
        <div className="rounded-xl border border-labora-ui bg-labora-ivory p-4">
          <SaveStatusIndicator status={saveStatus} error={saveError} />
          <QuestionnaireProgress value={completionPercentage} className="mt-3 min-w-56" />
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <NoticeRow icon={ShieldCheck}>
          La informacion que ingreses puede incluir datos laborales, pensionales o salariales.
        </NoticeRow>
        <NoticeRow icon={Sparkles}>
          Las conclusiones juridicas finales se validan con reglas verificables y revision cuando aplique.
        </NoticeRow>
      </div>
    </section>
  );
}

export function QuestionnaireProgress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-labora-gray">
        <span>Progreso</span>
        <span>{safeValue}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-labora-green transition-all"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

export function QuestionnaireStepper({
  sections,
  activeIndex,
  answers,
  onSelect,
}: {
  sections: QuestionnaireSection[];
  activeIndex: number;
  answers: QuestionnaireAnswers;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Secciones del cuestionario">
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-labora-ui bg-white p-2 shadow-panel xl:hidden">
        {sections.map((section, index) => (
          <StepperPill
            key={section.code}
            section={section}
            index={index}
            activeIndex={activeIndex}
            answers={answers}
            onSelect={onSelect}
          />
        ))}
        <button
          type="button"
          onClick={() => onSelect(sections.length)}
          aria-current={activeIndex === sections.length ? "step" : undefined}
          className={cn(
            "min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold",
            activeIndex === sections.length
              ? "bg-labora-deep text-white"
              : "text-labora-gray hover:bg-labora-ivory",
          )}
        >
          Resumen
        </button>
      </div>

      <div className="hidden rounded-2xl border border-labora-ui bg-white p-4 shadow-panel xl:block">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-labora-gray">
          Secciones
        </p>
        <div className="mt-4 grid gap-2">
          {sections.map((section, index) => (
            <StepperButton
              key={section.code}
              section={section}
              index={index}
              activeIndex={activeIndex}
              answers={answers}
              onSelect={onSelect}
            />
          ))}
          <button
            type="button"
            onClick={() => onSelect(sections.length)}
            aria-current={activeIndex === sections.length ? "step" : undefined}
            className={cn(
              "flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
              activeIndex === sections.length
                ? "bg-labora-deep text-white"
                : "text-labora-charcoal hover:bg-labora-ivory",
            )}
          >
            <span>Resumen</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function StepperPill({
  section,
  index,
  activeIndex,
  answers,
  onSelect,
}: {
  section: QuestionnaireSection;
  index: number;
  activeIndex: number;
  answers: QuestionnaireAnswers;
  onSelect: (index: number) => void;
}) {
  const progress = getSectionProgress(section, answers);
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      aria-current={activeIndex === index ? "step" : undefined}
      className={cn(
        "min-h-10 min-w-36 shrink-0 rounded-lg px-3 text-left text-xs font-semibold",
        activeIndex === index
          ? "bg-labora-deep text-white"
          : "text-labora-gray hover:bg-labora-ivory",
      )}
    >
      <span className="block truncate">{section.title}</span>
      <span className={cn("mt-1 block text-[11px]", activeIndex === index ? "text-white/70" : "text-labora-gray")}>
        {progress}% completo
      </span>
    </button>
  );
}

function StepperButton({
  section,
  index,
  activeIndex,
  answers,
  onSelect,
}: {
  section: QuestionnaireSection;
  index: number;
  activeIndex: number;
  answers: QuestionnaireAnswers;
  onSelect: (index: number) => void;
}) {
  const progress = getSectionProgress(section, answers);
  const completed = progress === 100;
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      aria-current={activeIndex === index ? "step" : undefined}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 text-left transition",
        activeIndex === index
          ? "bg-labora-deep text-white"
          : "text-labora-charcoal hover:bg-labora-ivory",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          activeIndex === index
            ? "border-white/30 bg-white/15"
            : completed
              ? "border-labora-green bg-labora-green text-white"
              : "border-labora-ui bg-white text-labora-gray",
        )}
      >
        {completed ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{section.title}</span>
        <span
          className={cn(
            "mt-0.5 block text-xs",
            activeIndex === index ? "text-white/70" : "text-labora-gray",
          )}
        >
          {progress}% completo
        </span>
      </span>
    </button>
  );
}

export function QuestionnaireSectionPanel({
  section,
  answers,
  errors,
  disabled,
  onChange,
  onBlur,
}: {
  section: QuestionnaireSection;
  answers: QuestionnaireAnswers;
  errors: QuestionnaireFieldErrors;
  disabled?: boolean;
  onChange: (question: Question, value: unknown) => void;
  onBlur: (question: Question) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
          Seccion {section.order}
        </p>
        <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
          {section.title}
        </h2>
        {section.description ? (
          <p className="mt-2 text-sm leading-6 text-labora-gray">{section.description}</p>
        ) : null}
      </div>

      {section.questions.map((question) => (
        <QuestionCard
          key={question.code}
          question={question}
          value={answers[question.code]}
          error={errors[question.code]}
          disabled={disabled}
          onChange={(value) => onChange(question, value)}
          onBlur={() => onBlur(question)}
        />
      ))}
    </section>
  );
}

export function QuestionCard({
  question,
  value,
  error,
  disabled,
  onChange,
  onBlur,
  readOnly,
}: {
  question: Question;
  value: unknown;
  error?: string;
  disabled?: boolean;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  readOnly?: boolean;
}) {
  const inputId = `question-${question.code}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const source = question.answer?.source;
  const showPrefill = source && source !== "user" && source !== "admin";

  return (
    <article className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {question.required ? (
              <span className="rounded-full bg-labora-ivory px-2.5 py-1 text-xs font-semibold text-labora-deep">
                Obligatoria
              </span>
            ) : null}
            {question.isCritical ? <CriticalAnswerBadge /> : null}
          </div>
          <label
            htmlFor={inputId}
            className="mt-3 block font-heading text-lg font-semibold leading-7 text-labora-charcoal"
          >
            {question.label}
          </label>
          {question.helpText ? (
            <p className="mt-2 text-sm leading-6 text-labora-gray">{question.helpText}</p>
          ) : null}
        </div>
      </div>

      {showPrefill ? <PrefilledAnswerNotice confidence={question.answer?.confidence} /> : null}
      {question.isCritical ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          Esta respuesta puede cambiar la ruta juridica del caso. Revisala con cuidado.
        </div>
      ) : null}

      <div className="mt-5">
        {readOnly ? (
          <p className="rounded-xl border border-labora-ui bg-labora-ivory px-4 py-3 text-sm font-medium text-labora-charcoal">
            {formatAnswerValue(question, value)}
          </p>
        ) : (
          <AnswerInputRenderer
            id={inputId}
            question={question}
            value={value}
            onChange={(nextValue) => onChange?.(nextValue)}
            onBlur={onBlur}
            disabled={disabled}
            errorId={errorId}
          />
        )}
      </div>

      {error ? (
        <p id={errorId} className="mt-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export function CriticalAnswerBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      Respuesta critica
    </span>
  );
}

export function PrefilledAnswerNotice({ confidence }: { confidence?: number | null }) {
  return (
    <div className="mt-4 rounded-xl border border-labora-mint bg-labora-mint/15 p-3 text-sm leading-6 text-labora-deep">
      Encontramos este dato en tus documentos. Puedes confirmarlo o corregirlo si no es exacto.
      {typeof confidence === "number" ? (
        <span className="ml-1 font-semibold">Confianza: {Math.round(confidence * 100)}%.</span>
      ) : null}
    </div>
  );
}

export function AnswerInputRenderer({
  id,
  question,
  value,
  onChange,
  onBlur,
  disabled,
  errorId,
}: {
  id: string;
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  disabled?: boolean;
  errorId?: string;
}) {
  const baseInputClass =
    "min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal outline-none transition placeholder:text-labora-gray/70 focus:border-labora-green focus:ring-2 focus:ring-labora-mint/50 disabled:cursor-not-allowed disabled:bg-labora-ivory";
  const commonProps = {
    id,
    disabled,
    "aria-invalid": Boolean(errorId),
    "aria-describedby": errorId,
    onBlur,
  };

  if (question.type === "yes_no") {
    return (
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-labelledby={id}>
        {[
          { label: "Si", optionValue: true },
          { label: "No", optionValue: false },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.optionValue)}
            className={cn(
              "min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold transition",
              value === option.optionValue
                ? "border-labora-green bg-labora-green text-white"
                : "border-labora-ui bg-white text-labora-charcoal hover:bg-labora-ivory",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "radio") {
    return (
      <fieldset className="grid gap-2" aria-describedby={errorId}>
        <legend className="sr-only">{question.label}</legend>
        {(question.options || []).map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer gap-3 rounded-xl border p-3 transition",
              value === option.value
                ? "border-labora-green bg-labora-mint/15"
                : "border-labora-ui bg-white hover:bg-labora-ivory",
            )}
          >
            <input
              type="radio"
              name={question.code}
              value={option.value}
              checked={value === option.value}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              onBlur={onBlur}
              className="mt-1 h-4 w-4 accent-labora-green"
            />
            <span>
              <span className="block text-sm font-semibold text-labora-charcoal">{option.label}</span>
              {option.description ? (
                <span className="mt-1 block text-sm leading-5 text-labora-gray">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (question.type === "checkbox") {
    const selectedValues = Array.isArray(value)
      ? value.flatMap((item) => (typeof item === "string" ? [item] : []))
      : [];

    if (!question.options?.length) {
      return (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-labora-ui bg-white p-3 text-sm font-semibold text-labora-charcoal">
          <input
            type="checkbox"
            checked={value === true}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
            onBlur={onBlur}
            className="h-4 w-4 accent-labora-green"
          />
          Confirmar
        </label>
      );
    }

    return (
      <fieldset className="grid gap-2" aria-describedby={errorId}>
        <legend className="sr-only">{question.label}</legend>
        {question.options.map((option) => {
          const checked = selectedValues.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border p-3 transition",
                checked
                  ? "border-labora-green bg-labora-mint/15"
                  : "border-labora-ui bg-white hover:bg-labora-ivory",
              )}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((item) => item !== option.value);
                  onChange(next);
                }}
                onBlur={onBlur}
                className="mt-1 h-4 w-4 accent-labora-green"
              />
              <span>
                <span className="block text-sm font-semibold text-labora-charcoal">{option.label}</span>
                {option.description ? (
                  <span className="mt-1 block text-sm leading-5 text-labora-gray">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </fieldset>
    );
  }

  if (question.type === "select") {
    return (
      <select
        {...commonProps}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className={baseInputClass}
      >
        <option value="">Selecciona una opcion</option>
        {(question.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === "date") {
    return (
      <input
        {...commonProps}
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className={baseInputClass}
      />
    );
  }

  if (question.type === "textarea") {
    return (
      <textarea
        {...commonProps}
        value={typeof value === "string" ? value : ""}
        maxLength={question.validation?.maxLength ?? 2000}
        rows={5}
        onChange={(event) => onChange(event.target.value)}
        className={cn(baseInputClass, "min-h-32 resize-y leading-6")}
      />
    );
  }

  if (question.type === "number" || question.type === "money") {
    return (
      <input
        {...commonProps}
        type="text"
        inputMode="decimal"
        value={typeof value === "number" || typeof value === "string" ? String(value) : ""}
        placeholder={question.type === "money" ? "Valor en COP" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={baseInputClass}
      />
    );
  }

  return (
    <input
      {...commonProps}
      type="text"
      value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
      placeholder={question.type === "file_reference" ? "Indica el soporte o documento" : undefined}
      onChange={(event) => onChange(event.target.value)}
      className={baseInputClass}
    />
  );
}

export function ProfilePreviewCard({ profile }: { profile?: CaseProfilePreview }) {
  const signals = [
    {
      label: "Servicio publico",
      value: profile?.hasPublicSectorWork,
    },
    {
      label: "Docencia o magisterio",
      value: profile?.hasTeacherHistory,
    },
    {
      label: "Regimen especial",
      value: profile?.hasSpecialRegimeSignal,
    },
    {
      label: "Semanas faltantes",
      value: profile?.hasMissingWeeksClaim,
    },
    {
      label: "Reliquidacion",
      value: profile?.hasReliquidationSignal,
    },
  ];

  return (
    <aside className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Perfil preliminar
        </h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-labora-gray">
        Senales que se iran ajustando con tus respuestas y documentos.
      </p>
      <div className="mt-4 grid gap-2">
        {signals.map((signal) => (
          <SignalRow key={signal.label} label={signal.label} value={signal.value} />
        ))}
      </div>
      {typeof profile?.confidence === "number" ? (
        <div className="mt-4 rounded-xl border border-labora-ui bg-labora-ivory p-3">
          <QuestionnaireProgress value={Math.round(profile.confidence * 100)} />
        </div>
      ) : null}
      {profile?.requiresReview ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Este perfil podria requerir revision del equipo.
        </div>
      ) : null}
    </aside>
  );
}

function SignalRow({ label, value }: { label: string; value?: boolean | null }) {
  const state =
    value === true
      ? { label: "Detectado", className: "bg-labora-mint/25 text-labora-deep" }
      : value === false
        ? { label: "No detectado", className: "bg-labora-ivory text-labora-gray" }
        : { label: "Por confirmar", className: "bg-labora-ivory text-labora-gray" };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-labora-ui px-3 py-2">
      <span className="text-sm font-medium text-labora-charcoal">{label}</span>
      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", state.className)}>
        {state.label}
      </span>
    </div>
  );
}

export function MissingDocumentsCard({ documents }: { documents?: string[] }) {
  if (!documents?.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-panel">
      <div className="flex items-start gap-3">
        <FileQuestion className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold">Documentos sugeridos</h2>
          <p className="mt-1 text-sm leading-6">
            Estos soportes podrian ayudar a completar el analisis.
          </p>
          <ul className="mt-3 grid gap-2 text-sm">
            {documents.map((document) => (
              <li key={document} className="rounded-lg bg-white px-3 py-2 font-medium">
                {document}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function QuestionnaireWarnings({ warnings }: { warnings: QuestionnaireWarning[] }) {
  if (!warnings.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-panel">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold">Revisa antes de continuar</h2>
          <ul className="mt-2 grid gap-2 text-sm leading-6">
            {warnings.map((warning) => (
              <li key={`${warning.code}-${warning.message}`}>{warning.message}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function QuestionnaireSummaryStep({
  sections,
  answers,
  profile,
  confirmAccuracy,
  onConfirmAccuracyChange,
  onEdit,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  sections: QuestionnaireSection[];
  answers: QuestionnaireAnswers;
  profile?: CaseProfilePreview;
  confirmAccuracy: boolean;
  onConfirmAccuracyChange: (value: boolean) => void;
  onEdit: (sectionIndex: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
}) {
  const criticalQuestions = getCriticalAnsweredQuestions(sections, answers);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
          Revision final
        </p>
        <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
          Revisa tus respuestas
        </h2>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          Puedes volver a cualquier seccion antes de enviar el cuestionario.
        </p>
        {criticalQuestions.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {criticalQuestions.map((question) => (
              <span
                key={question.code}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
              >
                {question.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {sections.map((section, index) => (
        <AnswerReviewCard
          key={section.code}
          section={section}
          answers={answers}
          onEdit={() => onEdit(index)}
        />
      ))}

      <MissingDocumentsCard documents={profile?.missingDocuments} />
      <ProfilePreviewCard profile={profile} />

      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-labora-charcoal">
          <input
            type="checkbox"
            checked={confirmAccuracy}
            onChange={(event) => onConfirmAccuracyChange(event.target.checked)}
            className="mt-1 h-4 w-4 accent-labora-green"
          />
          <span>
            Confirmo que la informacion suministrada es correcta segun mi conocimiento.
          </span>
        </label>
        {submitError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {submitError}
          </div>
        ) : null}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!confirmAccuracy || isSubmitting}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white shadow-panel transition hover:bg-labora-deep disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Enviar cuestionario
        </button>
      </section>
    </section>
  );
}

export function AnswerReviewCard({
  section,
  answers,
  onEdit,
}: {
  section: QuestionnaireSection;
  answers: QuestionnaireAnswers;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
            {section.title}
          </h3>
          {section.description ? (
            <p className="mt-1 text-sm leading-6 text-labora-gray">{section.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar
        </button>
      </div>
      <dl className="mt-4 divide-y divide-labora-ui rounded-xl border border-labora-ui">
        {section.questions.map((question) => (
          <div key={question.code} className="p-3">
            <dt className="flex flex-wrap items-center gap-2 text-sm font-semibold text-labora-charcoal">
              {question.label}
              {question.isCritical ? <CriticalAnswerBadge /> : null}
            </dt>
            <dd
              className={cn(
                "mt-1 text-sm leading-6",
                isEmptyAnswer(answers[question.code]) ? "text-labora-gray" : "text-labora-charcoal",
              )}
            >
              {formatAnswerValue(question, answers[question.code])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function QuestionnaireCompletedState({
  result,
  status,
  profile,
  caseId,
}: {
  result?: SubmitQuestionnaireResponse | null;
  status: "completed" | "requires_review";
  profile?: CaseProfilePreview;
  caseId: string;
}) {
  const nextHref = result?.nextStep?.href || `/app/cases/${caseId}/preanalysis`;
  const nextLabel = result?.nextStep?.label || "Continuar al preanalisis";

  return (
    <section className="space-y-5">
      <div
        className={cn(
          "rounded-2xl border p-6 shadow-panel",
          status === "requires_review"
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : "border-emerald-200 bg-emerald-50 text-emerald-900",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white">
            {status === "requires_review" ? (
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <StatusBadge status={status} />
            <h1 className="mt-3 font-heading text-2xl font-semibold">
              Cuestionario enviado
            </h1>
            <p className="mt-2 text-sm leading-6">
              Ya tenemos la informacion necesaria para actualizar el perfil preliminar del caso.
            </p>
            <p className="mt-2 text-sm font-semibold">
              Enviado: {formatDateTime(result?.completedAt)}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={nextHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white"
              >
                {nextLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={`/app/cases/${caseId}`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep"
              >
                Volver al expediente
              </Link>
            </div>
          </div>
        </div>
      </div>
      <ProfilePreviewCard profile={profile} />
    </section>
  );
}

export function QuestionnaireNavigation({
  activeIndex,
  lastSectionIndex,
  onBack,
  onSave,
  onNext,
  isSaving,
}: {
  activeIndex: number;
  lastSectionIndex: number;
  onBack: () => void;
  onSave: () => void;
  onNext: () => void;
  isSaving: boolean;
}) {
  const isSummary = activeIndex === lastSectionIndex + 1;

  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-labora-ui bg-white/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:rounded-2xl md:border md:p-4 md:shadow-panel">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={activeIndex === 0}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </button>
        <div className="flex flex-col gap-3 sm:flex-row">
          {!isSummary ? (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Guardar
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white shadow-panel hover:bg-labora-deep"
          >
            {activeIndex >= lastSectionIndex ? "Revisar respuestas" : "Continuar"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminQuestionnaireReview({
  data,
  onDecision,
  isMutating,
  error,
}: {
  data: QuestionnaireResponse;
  onDecision: (payload: AdminQuestionnaireDecisionPayload) => Promise<unknown>;
  isMutating: boolean;
  error?: string | null;
}) {
  const [comment, setComment] = useState("");
  const answers = useMemo(() => collectInitialAnswers(data), [data]);
  const sections = useMemo(
    () =>
      data.sections
        .filter((section) => section.visible)
        .map((section) => ({
          ...section,
          questions: section.questions.filter((question) => question.visible),
        })),
    [data.sections],
  );
  const criticalQuestions = getCriticalAnsweredQuestions(sections, answers);

  async function decide(action: AdminQuestionnaireDecisionPayload["action"]) {
    await onDecision({ action, comment: comment.trim() || undefined });
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <StatusBadge status={data.session.status} />
            <h1 className="mt-3 font-heading text-2xl font-semibold text-labora-charcoal">
              Revision del cuestionario
            </h1>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Respuestas del usuario, senales detectadas y observaciones internas del caso.
            </p>
          </div>
          <QuestionnaireProgress value={data.session.completionPercentage} className="min-w-56" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {criticalQuestions.length ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-panel">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="font-heading text-lg font-semibold">Respuestas criticas</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {criticalQuestions.map((question) => (
                      <span
                        key={question.code}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold"
                      >
                        {question.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {sections.map((section) => (
            <section key={section.code} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                {section.title}
              </h2>
              <dl className="mt-4 divide-y divide-labora-ui rounded-xl border border-labora-ui">
                {section.questions.map((question) => (
                  <div key={question.code} className="p-3">
                    <dt className="flex flex-wrap items-center gap-2 text-sm font-semibold text-labora-charcoal">
                      {question.label}
                      {question.isCritical ? <CriticalAnswerBadge /> : null}
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-labora-gray">
                      {formatAnswerValue(question, answers[question.code])}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <aside className="space-y-5">
          <ProfilePreviewCard profile={data.profilePreview} />
          <MissingDocumentsCard documents={data.profilePreview?.missingDocuments} />
          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-labora-green" aria-hidden="true" />
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Observaciones internas
              </h2>
            </div>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              className="mt-4 min-h-28 w-full rounded-lg border border-labora-ui px-3 py-2 text-sm text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-mint/50"
              placeholder="Escribe una nota para el equipo"
            />
            {error ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}
            <div className="mt-4 grid gap-2">
              <AdminActionButton
                label="Aprobar"
                action="approve"
                onClick={decide}
                disabled={isMutating}
              />
              <AdminActionButton
                label="Marcar requiere revision"
                action="mark_requires_review"
                onClick={decide}
                disabled={isMutating}
              />
              <AdminActionButton
                label="Solicitar aclaracion"
                action="request_clarification"
                onClick={decide}
                disabled={isMutating}
              />
              <AdminActionButton
                label="Rechazar"
                action="reject"
                onClick={decide}
                disabled={isMutating}
                tone="danger"
              />
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function AdminActionButton({
  label,
  action,
  onClick,
  disabled,
  tone = "default",
}: {
  label: string;
  action: AdminQuestionnaireDecisionPayload["action"];
  onClick: (action: AdminQuestionnaireDecisionPayload["action"]) => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(action)}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        tone === "danger"
          ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
          : "border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory",
      )}
    >
      {label}
    </button>
  );
}
