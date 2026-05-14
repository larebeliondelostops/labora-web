"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  completeDocumentUpload,
  createDocumentUpload,
  createReplacementUpload,
  deleteDocument,
  getCaseDocuments,
  getDocumentDetail,
  getDocumentErrorMessage,
  getDocumentReadiness,
  getDocumentTypes,
  getDocumentViewUrl,
  updateDocument,
  uploadFileToUrl,
} from "@/src/modules/documents/api/documents.api";
import type {
  DocumentDetail,
  DocumentItem,
  DocumentReadiness,
  DocumentTypeDefinition,
  DocumentViewUrlResponse,
  ReplaceDocumentRequest,
  UpdateDocumentRequest,
} from "@/src/modules/documents/api/documents.types";
import {
  DEFAULT_DOCUMENT_TYPES,
  deriveReadinessFromDocuments,
  isDocumentProcessing,
} from "@/src/modules/documents/utils/document-ui";

type AsyncState<T> = {
  data: T;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type UploadQueueStatus = "queued" | "uploading" | "success" | "error" | "canceled";

export type UploadQueueItem = {
  id: string;
  file: File;
  fileName: string;
  sizeBytes: number;
  progress: number;
  status: UploadQueueStatus;
  error?: string;
  document?: DocumentItem;
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function useAsyncResource<T>(
  loader: () => Promise<T>,
  initialData: T,
  enabled = true,
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    isLoading: enabled,
    isRefreshing: false,
    error: null,
  });

  const load = useCallback(
    async (silent = false) => {
      if (!enabled) {
        return;
      }

      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await loader();
        setState({
          data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (error) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getDocumentErrorMessage(error),
        }));
      }
    },
    [enabled, loader],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
  };
}

export function useDocumentTypes() {
  const loader = useCallback(async () => {
    const types = await getDocumentTypes();
    return types.length ? types : DEFAULT_DOCUMENT_TYPES;
  }, []);

  return useAsyncResource<DocumentTypeDefinition[]>(
    loader,
    DEFAULT_DOCUMENT_TYPES,
  );
}

export function useCaseDocuments(caseId: string, enabled = true) {
  const loader = useCallback(() => getCaseDocuments(caseId), [caseId]);
  const resource = useAsyncResource<DocumentItem[]>(loader, [], Boolean(caseId) && enabled);
  const shouldPoll = useMemo(
    () => resource.data.some(isDocumentProcessing),
    [resource.data],
  );

  useEffect(() => {
    if (!shouldPoll || !enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      resource.refresh();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [enabled, resource, shouldPoll]);

  return {
    ...resource,
    shouldPoll,
  };
}

export function useDocumentReadiness(
  caseId: string,
  documents: DocumentItem[],
  enabled = true,
) {
  const fallback = useMemo(
    () => deriveReadinessFromDocuments(caseId, documents),
    [caseId, documents],
  );
  const loader = useCallback(() => getDocumentReadiness(caseId), [caseId]);
  const resource = useAsyncResource<DocumentReadiness>(
    loader,
    fallback,
    Boolean(caseId) && enabled,
  );
  const shouldPoll = useMemo(
    () => documents.some(isDocumentProcessing),
    [documents],
  );

  useEffect(() => {
    if (!shouldPoll || !enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      resource.refresh();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [enabled, resource, shouldPoll]);

  return {
    ...resource,
    data: resource.error ? fallback : resource.data,
  };
}

export function useDocumentDetail(documentId: string, enabled = true) {
  const loader = useCallback(() => getDocumentDetail(documentId), [documentId]);
  return useAsyncResource<DocumentDetail | null>(
    loader,
    null,
    Boolean(documentId) && enabled,
  );
}

export function useDocumentViewUrl(documentId: string, enabled = true) {
  const loader = useCallback(() => getDocumentViewUrl(documentId), [documentId]);
  return useAsyncResource<DocumentViewUrlResponse | null>(
    loader,
    null,
    Boolean(documentId) && enabled,
  );
}

async function uploadWithResponse({
  response,
  file,
  signal,
  onProgress,
}: {
  response: {
    document: DocumentItem;
    upload?: {
      method: "signed_url" | "multipart";
      uploadUrl?: string;
      headers?: Record<string, string>;
    };
  };
  file: File;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}) {
  if (response.upload?.uploadUrl) {
    await uploadFileToUrl({
      file,
      uploadUrl: response.upload.uploadUrl,
      method: response.upload.method === "multipart" ? "POST" : "PUT",
      headers: response.upload.headers,
      signal,
      onProgress,
    });
  } else {
    onProgress?.(100);
  }

  const completed = await completeDocumentUpload(response.document.id);
  return completed || response.document;
}

export function useUploadDocument({
  caseId,
  onCompleted,
}: {
  caseId: string;
  onCompleted?: (document: DocumentItem) => void;
}) {
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const abortControllers = useRef(new Map<string, AbortController>());

  const patchItem = useCallback((id: string, patch: Partial<UploadQueueItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const uploadFile = useCallback(
    async (
      file: File,
      options?: {
        documentTypeCode?: string;
        isPrimary?: boolean;
      },
    ) => {
      const id = makeId();
      const controller = new AbortController();
      abortControllers.current.set(id, controller);

      setItems((current) => [
        ...current,
        {
          id,
          file,
          fileName: file.name,
          sizeBytes: file.size,
          progress: 5,
          status: "queued",
        },
      ]);

      try {
        patchItem(id, { status: "uploading", progress: 10 });
        const response = await createDocumentUpload(caseId, {
          originalFilename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          documentTypeCode: options?.documentTypeCode,
          isPrimary: options?.isPrimary,
        });

        const document = await uploadWithResponse({
          response,
          file,
          signal: controller.signal,
          onProgress: (progress) => {
            patchItem(id, {
              progress: Math.min(95, Math.max(15, Math.round(progress * 0.8 + 15))),
            });
          },
        });

        patchItem(id, {
          status: "success",
          progress: 100,
          document,
        });
        onCompleted?.(document);
        return document;
      } catch (error) {
        const wasCanceled = controller.signal.aborted;
        patchItem(id, {
          status: wasCanceled ? "canceled" : "error",
          error: wasCanceled ? "La carga fue cancelada." : getDocumentErrorMessage(error),
        });
        throw error;
      } finally {
        abortControllers.current.delete(id);
      }
    },
    [caseId, onCompleted, patchItem],
  );

  const uploadFiles = useCallback(
    async (
      files: File[],
      options?: {
        documentTypeCode?: string;
        isPrimary?: boolean;
      },
    ) => {
      const results: DocumentItem[] = [];

      for (const file of files) {
        const document = await uploadFile(file, options);
        results.push(document);
      }

      return results;
    },
    [uploadFile],
  );

  const cancelUpload = useCallback(
    (id: string) => {
      abortControllers.current.get(id)?.abort();
      patchItem(id, {
        status: "canceled",
        error: "La carga fue cancelada.",
      });
    },
    [patchItem],
  );

  const clearCompleted = useCallback(() => {
    setItems((current) => current.filter((item) => item.status !== "success"));
  }, []);

  return {
    items,
    uploadFile,
    uploadFiles,
    cancelUpload,
    clearCompleted,
  };
}

export function useUpdateDocument() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (documentId: string, payload: UpdateDocumentRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      return await updateDocument(documentId, payload);
    } catch (requestError) {
      const message = getDocumentErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error };
}

export function useReplaceDocument({
  onCompleted,
}: {
  onCompleted?: (document: DocumentItem) => void;
} = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (documentId: string, file: File, payload?: Partial<ReplaceDocumentRequest>) => {
      setIsLoading(true);
      setError(null);
      const controller = new AbortController();

      try {
        const response = await createReplacementUpload(documentId, {
          originalFilename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          documentTypeCode: payload?.documentTypeCode,
          isPrimary: payload?.isPrimary,
          reason: payload?.reason,
        });
        const document = await uploadWithResponse({
          response,
          file,
          signal: controller.signal,
        });

        onCompleted?.(document);
        return document;
      } catch (requestError) {
        const message = getDocumentErrorMessage(requestError);
        setError(message);
        throw requestError;
      } finally {
        setIsLoading(false);
      }
    },
    [onCompleted],
  );

  return { mutate, isLoading, error };
}

export function useDeleteDocument() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (documentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteDocument(documentId);
    } catch (requestError) {
      const message = getDocumentErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error };
}
