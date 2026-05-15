"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import {
  ProfilePreviewCard,
  QuestionnaireBlockedState,
  QuestionnaireCompletedState,
  QuestionnaireErrorState,
  QuestionnaireHeader,
  QuestionnaireIntroState,
  QuestionnaireNavigation,
  QuestionnaireSectionPanel,
  QuestionnaireSkeleton,
  QuestionnaireStepper,
  QuestionnaireSummaryStep,
  QuestionnaireWarnings,
} from "@/src/modules/questionnaire/components/questionnaire-components";
import { useQuestionnaire } from "@/src/modules/questionnaire/hooks/useQuestionnaire";
import type { Question } from "@/src/modules/questionnaire/api/questionnaire.types";
import {
  collectInitialAnswers,
  getVisibleSections,
  normalizeQuestionValue,
  validateSectionAnswers,
  type QuestionnaireAnswers,
  type QuestionnaireFieldErrors,
} from "@/src/modules/questionnaire/utils/questionnaire-utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const delayedSaveTypes = new Set([
  "text",
  "textarea",
  "number",
  "money",
  "file_reference",
]);

export function CaseQuestionnairePage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const caseDetail = useCaseDetail(caseId);
  const questionnaire = useQuestionnaire(caseId);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [fieldErrors, setFieldErrors] = useState<QuestionnaireFieldErrors>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimers = useRef(new Map<string, number>());
  const initializedCaseId = useRef<string | null>(null);

  const data = questionnaire.data;
  const visibleSections = useMemo(() => getVisibleSections(data), [data]);
  const currentSection =
    activeIndex < visibleSections.length ? visibleSections[activeIndex] : null;
  const isSummaryStep = activeIndex === visibleSections.length;
  const isReadonly =
    data?.session.status === "completed" ||
    data?.session.status === "requires_review" ||
    data?.session.status === "blocked";

  useEffect(() => {
    if (!data) {
      return;
    }

    const initialAnswers = collectInitialAnswers(data);
    if (initializedCaseId.current !== data.caseId) {
      initializedCaseId.current = data.caseId;
      setAnswers(initialAnswers);
      setFieldErrors({});
      setConfirmAccuracy(false);
      return;
    }

    setAnswers((current) => ({ ...initialAnswers, ...current }));
  }, [data]);

  useEffect(() => {
    if (!data || visibleSections.length === 0) {
      return;
    }

    const currentSectionCode = data.session.currentSection;
    const nextIndex = visibleSections.findIndex(
      (section) => section.code === currentSectionCode,
    );

    if (nextIndex >= 0 && activeIndex === 0) {
      setActiveIndex(nextIndex);
    }
  }, [activeIndex, data, visibleSections]);

  useEffect(() => {
    return () => {
      saveTimers.current.forEach((timer) => window.clearTimeout(timer));
      saveTimers.current.clear();
    };
  }, []);

  useEffect(() => {
    if (questionnaire.isSaving) {
      setSaveStatus("saving");
    }
  }, [questionnaire.isSaving]);

  useEffect(() => {
    if (questionnaire.saveError) {
      setSaveStatus("error");
    }
  }, [questionnaire.saveError]);

  const saveQuestion = useCallback(
    async (question: Question, rawValue: unknown) => {
      if (!data || isReadonly) {
        return;
      }

      const value = normalizeQuestionValue(question, rawValue);
      setSaveStatus("saving");

      try {
        await questionnaire.saveAnswers([
          {
            questionCode: question.code,
            value,
          },
        ]);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    },
    [data, isReadonly, questionnaire],
  );

  const scheduleSave = useCallback(
    (question: Question, value: unknown) => {
      const existingTimer = saveTimers.current.get(question.code);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      if (!delayedSaveTypes.has(question.type)) {
        void saveQuestion(question, value);
        return;
      }

      const timer = window.setTimeout(() => {
        saveTimers.current.delete(question.code);
        void saveQuestion(question, value);
      }, 700);
      saveTimers.current.set(question.code, timer);
    },
    [saveQuestion],
  );

  function handleAnswerChange(question: Question, value: unknown) {
    setAnswers((current) => ({ ...current, [question.code]: value }));
    setFieldErrors((current) => {
      if (!current[question.code]) {
        return current;
      }

      const next = { ...current };
      delete next[question.code];
      return next;
    });
    scheduleSave(question, value);
  }

  function handleAnswerBlur(question: Question) {
    const timer = saveTimers.current.get(question.code);
    if (timer) {
      window.clearTimeout(timer);
      saveTimers.current.delete(question.code);
    }

    void saveQuestion(question, answers[question.code]);
  }

  const saveCurrentSection = useCallback(async () => {
    if (!currentSection || !data || isReadonly) {
      return true;
    }

    const payload = currentSection.questions
      .filter((question) => answers[question.code] !== undefined)
      .map((question) => ({
        questionCode: question.code,
        value: normalizeQuestionValue(question, answers[question.code]),
      }));

    if (!payload.length) {
      return true;
    }

    setSaveStatus("saving");
    try {
      await questionnaire.saveAnswers(payload);
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("error");
      return false;
    }
  }, [answers, currentSection, data, isReadonly, questionnaire]);

  async function goToStep(index: number) {
    const safeIndex = Math.min(Math.max(index, 0), visibleSections.length);

    if (safeIndex > activeIndex && currentSection) {
      const errors = validateSectionAnswers(currentSection, answers);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      const saved = await saveCurrentSection();
      if (!saved) {
        return;
      }
    }

    setFieldErrors({});
    setActiveIndex(safeIndex);
  }

  async function handleNext() {
    if (!currentSection) {
      return;
    }

    const errors = validateSectionAnswers(currentSection, answers);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const saved = await saveCurrentSection();
    if (!saved) {
      return;
    }

    setFieldErrors({});
    setActiveIndex((current) => Math.min(current + 1, visibleSections.length));
  }

  async function handleSubmit() {
    const allErrors = visibleSections.reduce<{
      errors: QuestionnaireFieldErrors;
      firstInvalidIndex: number;
    }>(
      (acc, section, index) => {
        const errors = validateSectionAnswers(section, answers);
        if (Object.keys(errors).length > 0 && acc.firstInvalidIndex < 0) {
          acc.firstInvalidIndex = index;
        }

        return { errors: { ...acc.errors, ...errors }, firstInvalidIndex: acc.firstInvalidIndex };
      },
      { errors: {}, firstInvalidIndex: -1 },
    );

    if (Object.keys(allErrors.errors).length > 0) {
      setFieldErrors(allErrors.errors);
      setActiveIndex(Math.max(allErrors.firstInvalidIndex, 0));
      return;
    }

    const payload = visibleSections.flatMap((section) =>
      section.questions
        .filter((question) => answers[question.code] !== undefined)
        .map((question) => ({
          questionCode: question.code,
          value: normalizeQuestionValue(question, answers[question.code]),
        })),
    );

    if (payload.length) {
      const saved = await questionnaire.saveAnswers(payload);
      if (!saved) {
        return;
      }
    }

    const result = await questionnaire.submit(confirmAccuracy);
    if (result?.nextStep?.href) {
      router.prefetch(result.nextStep.href);
    }
  }

  if (questionnaire.isLoading) {
    return <QuestionnaireSkeleton />;
  }

  if (questionnaire.error && !data) {
    const href = questionnaire.error.toLowerCase().includes("autoriz")
      ? "/app/onboarding/consentimientos"
      : undefined;

    return (
      <QuestionnaireErrorState
        message={questionnaire.error}
        onRetry={questionnaire.refetch}
        href={href}
      />
    );
  }

  if (!data) {
    return (
      <QuestionnaireErrorState
        message="No encontramos el cuestionario de este expediente."
        onRetry={questionnaire.refetch}
      />
    );
  }

  if (data.session.status === "blocked") {
    return <QuestionnaireBlockedState caseId={caseId} message={questionnaire.error || undefined} />;
  }

  if (data.session.status === "error") {
    return (
      <QuestionnaireErrorState
        message={questionnaire.error || "No pudimos cargar el cuestionario. Revisa tu conexion o intenta nuevamente."}
        onRetry={questionnaire.refetch}
      />
    );
  }

  if (data.session.status === "completed" || data.session.status === "requires_review") {
    return (
      <QuestionnaireCompletedState
        result={questionnaire.submitResult}
        status={data.session.status}
        profile={data.profilePreview}
        caseId={caseId}
      />
    );
  }

  if (data.session.status === "not_started") {
    return (
      <section className="space-y-5 pb-20 md:pb-0">
        {caseDetail.data ? (
          <CaseHeader
            caseNumber={caseDetail.data.caseNumber}
            status={caseDetail.data.status}
            holderFullName={getHolderFullName(caseDetail.data.holder)}
            updatedAt={caseDetail.data.updatedAt}
          />
        ) : null}
        <QuestionnaireIntroState
          onStart={() => {
            void questionnaire.start();
          }}
          isStarting={questionnaire.isStarting}
        />
      </section>
    );
  }

  if (!visibleSections.length) {
    return (
      <QuestionnaireErrorState
        message="El cuestionario aun no tiene preguntas visibles para este expediente."
        onRetry={questionnaire.refetch}
      />
    );
  }

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      {caseDetail.data ? (
        <CaseHeader
          caseNumber={caseDetail.data.caseNumber}
          status={caseDetail.data.status}
          holderFullName={getHolderFullName(caseDetail.data.holder)}
          updatedAt={caseDetail.data.updatedAt}
        />
      ) : null}

      <QuestionnaireHeader
        status={data.session.status}
        completionPercentage={data.session.completionPercentage}
        isRefreshing={questionnaire.isRefreshing}
        saveStatus={questionnaire.isSaving ? "saving" : saveStatus}
        saveError={questionnaire.saveError}
      />

      <QuestionnaireWarnings warnings={questionnaire.warnings} />

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <div className="xl:sticky xl:top-5 xl:self-start">
          <QuestionnaireStepper
            sections={visibleSections}
            activeIndex={activeIndex}
            answers={answers}
            onSelect={(index) => {
              void goToStep(index);
            }}
          />
        </div>

        <div className="space-y-5">
          {isSummaryStep ? (
            <QuestionnaireSummaryStep
              sections={visibleSections}
              answers={answers}
              profile={data.profilePreview}
              confirmAccuracy={confirmAccuracy}
              onConfirmAccuracyChange={setConfirmAccuracy}
              onEdit={(index) => {
                setActiveIndex(index);
                setFieldErrors({});
              }}
              onSubmit={() => {
                void handleSubmit();
              }}
              isSubmitting={questionnaire.isSubmitting}
              submitError={questionnaire.submitError}
            />
          ) : currentSection ? (
            <>
              <QuestionnaireSectionPanel
                section={currentSection}
                answers={answers}
                errors={fieldErrors}
                disabled={isReadonly}
                onChange={handleAnswerChange}
                onBlur={handleAnswerBlur}
              />
              <QuestionnaireNavigation
                activeIndex={activeIndex}
                lastSectionIndex={visibleSections.length - 1}
                onBack={() => {
                  void goToStep(activeIndex - 1);
                }}
                onSave={() => {
                  void saveCurrentSection();
                }}
                onNext={() => {
                  void handleNext();
                }}
                isSaving={questionnaire.isSaving}
              />
            </>
          ) : null}
        </div>

        <div className="xl:sticky xl:top-5 xl:self-start">
          <ProfilePreviewCard profile={data.profilePreview} />
        </div>
      </div>
    </section>
  );
}
