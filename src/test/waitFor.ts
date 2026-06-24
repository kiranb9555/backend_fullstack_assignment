export const waitFor = async (
    fn: () => Promise<boolean>,
    options?: {
      timeoutMs?: number;
      intervalMs?: number;
    }
  ): Promise<void> => {
    const timeoutMs =
      options?.timeoutMs ?? 10000;
  
    const intervalMs =
      options?.intervalMs ?? 250;
  
    const startedAt =
      Date.now();
  
    while (Date.now() - startedAt < timeoutMs) {
      const done = await fn();
  
      if (done) {
        return;
      }
  
      await new Promise(resolve =>
        setTimeout(resolve, intervalMs)
      );
    }
  
    throw new Error(
      `waitFor timed out after ${timeoutMs}ms`
    );
  };