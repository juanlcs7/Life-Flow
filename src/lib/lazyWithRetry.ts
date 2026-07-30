import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export function lazyWithRetry<T extends ComponentType>(
  factory: () => Promise<{ default: T }>,
  name: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    const retryKey = `lifeflow_chunk_retry_${name}`;

    try {
      const loadedModule = await factory();
      sessionStorage.removeItem(retryKey);
      return loadedModule;
    } catch (error) {
      if (!sessionStorage.getItem(retryKey)) {
        sessionStorage.setItem(retryKey, "1");
        window.location.reload();

        return new Promise<never>(() => undefined);
      }

      sessionStorage.removeItem(retryKey);
      throw error;
    }
  });
}
