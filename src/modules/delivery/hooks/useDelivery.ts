"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  deliveryApi,
  getDeliveryErrorMessage,
} from "@/src/modules/delivery/api/delivery.api";
import type {
  CloseCasePayload,
  CloseCaseResponse,
  ComplementDeliveryPayload,
  ComplementDeliveryResponse,
  CreateShareLinkPayload,
  CreateShareLinkResponse,
  DeliveryPackageStatus,
  DeliveryResponse,
  DownloadFileStatus,
  DownloadUrlResponse,
  PaginatedDeliveryEvents,
  ShareLink,
  SharedDeliveryResponse,
} from "@/src/modules/delivery/api/delivery.types";

type AsyncState<T> = {
  data: T;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type NullableAsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type MutationState = {
  isLoading: boolean;
  error: string | null;
};

const pollingPackageStatuses: DeliveryPackageStatus[] = [
  "generating",
  "partially_ready",
];

const pollingFileStatuses: DownloadFileStatus[] = ["pending", "requires_review"];

function makeEmptyDelivery(caseId: string): DeliveryResponse {
  return {
    caseId,
    package: null,
    files: [],
    shareLinks: [],
    timeline: [],
    availableActions: {
      canDownload: false,
      canCreateShareLink: false,
      canComplementCase: false,
      canCloseCase: false,
    },
  };
}

function shouldPollDelivery(data: DeliveryResponse) {
  return Boolean(
    data.package?.status &&
      pollingPackageStatuses.includes(data.package.status),
  ) || data.files.some((file) => pollingFileStatuses.includes(file.status));
}

function useMutation<TPayload, TResult>(
  action: (payload: TPayload) => Promise<TResult>,
) {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (payload: TPayload) => {
      setState({ isLoading: true, error: null });

      try {
        return await action(payload);
      } catch (requestError) {
        const message = getDeliveryErrorMessage(requestError);
        setState({ isLoading: false, error: message });
        throw requestError;
      } finally {
        setState((current) => ({ ...current, isLoading: false }));
      }
    },
    [action],
  );

  return {
    ...state,
    mutate,
    clearError: () => setState((current) => ({ ...current, error: null })),
  };
}

export function useDelivery(caseId: string, options: { poll?: boolean } = {}) {
  const { poll = true } = options;
  const [state, setState] = useState<AsyncState<DeliveryResponse>>({
    data: makeEmptyDelivery(caseId),
    isLoading: Boolean(caseId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!caseId || requestInFlight.current) {
        return null;
      }

      requestInFlight.current = true;
      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await deliveryApi.getDelivery(caseId);
        setState({
          data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
        return data;
      } catch (requestError) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getDeliveryErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [caseId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const shouldPoll = useMemo(() => shouldPollDelivery(state.data), [state.data]);

  useEffect(() => {
    if (!poll || !shouldPoll) {
      return;
    }

    const timer = window.setInterval(() => {
      load(true);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [load, poll, shouldPoll]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    setData: (data: DeliveryResponse) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
  };
}

export function useSharedDelivery(token: string) {
  const [state, setState] = useState<NullableAsyncState<SharedDeliveryResponse>>({
    data: null,
    isLoading: Boolean(token),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!token || requestInFlight.current) {
        return null;
      }

      requestInFlight.current = true;
      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await deliveryApi.getSharedDelivery(token);
        setState({
          data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
        return data;
      } catch (requestError) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getDeliveryErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [token],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
  };
}

export function useDeliveryEvents(caseId: string) {
  const [state, setState] = useState<AsyncState<PaginatedDeliveryEvents>>({
    data: { items: [], nextCursor: null },
    isLoading: Boolean(caseId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (cursor?: string, append = false) => {
      if (!caseId || requestInFlight.current) {
        return null;
      }

      requestInFlight.current = true;
      setState((current) => ({
        ...current,
        isLoading: !append,
        isRefreshing: append,
        error: null,
      }));

      try {
        const data = await deliveryApi.getDeliveryEvents(caseId, cursor);
        setState((current) => ({
          data: append
            ? { ...data, items: [...current.data.items, ...data.items] }
            : data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        }));
        return data;
      } catch (requestError) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getDeliveryErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [caseId],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    refetch: () => load(),
    loadMore: () => load(state.data.nextCursor || undefined, true),
  };
}

export function useDownloadDeliveryFile() {
  const mutation = useMutation<string, DownloadUrlResponse>(
    deliveryApi.downloadFile,
  );

  return {
    ...mutation,
    download: mutation.mutate,
  };
}

export function useDownloadDeliveryPackage(caseId: string) {
  const action = useCallback(
    () => deliveryApi.downloadPackage(caseId),
    [caseId],
  );
  const mutation = useMutation<void, DownloadUrlResponse>(action);

  return {
    ...mutation,
    downloadAll: () => mutation.mutate(undefined),
  };
}

export function useDownloadSharedDeliveryFile(token: string) {
  const action = useCallback(
    (fileId: string) => deliveryApi.downloadSharedFile(token, fileId),
    [token],
  );
  const mutation = useMutation<string, DownloadUrlResponse>(action);

  return {
    ...mutation,
    download: mutation.mutate,
  };
}

export function useCreateShareLink(caseId: string) {
  const action = useCallback(
    (payload: CreateShareLinkPayload) =>
      deliveryApi.createShareLink(caseId, payload),
    [caseId],
  );
  const mutation = useMutation<CreateShareLinkPayload, CreateShareLinkResponse>(action);

  return {
    ...mutation,
    create: mutation.mutate,
  };
}

export function useRevokeShareLink(caseId: string) {
  const action = useCallback(
    (shareLinkId: string) => deliveryApi.revokeShareLink(caseId, shareLinkId),
    [caseId],
  );
  const mutation = useMutation<string, ShareLink>(action);

  return {
    ...mutation,
    revoke: mutation.mutate,
  };
}

export function useComplementDelivery(caseId: string) {
  const action = useCallback(
    (payload: ComplementDeliveryPayload) =>
      deliveryApi.complementDelivery(caseId, payload),
    [caseId],
  );
  const mutation = useMutation<ComplementDeliveryPayload, ComplementDeliveryResponse>(action);

  return {
    ...mutation,
    submit: mutation.mutate,
  };
}

export function useCloseDeliveryCase(caseId: string) {
  const action = useCallback(
    (payload: CloseCasePayload) => deliveryApi.closeCase(caseId, payload),
    [caseId],
  );
  const mutation = useMutation<CloseCasePayload, CloseCaseResponse>(action);

  return {
    ...mutation,
    close: mutation.mutate,
  };
}
