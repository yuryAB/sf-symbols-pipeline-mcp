export function toolSuccess<T>(structuredContent: T, summary: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: summary,
      },
    ],
    structuredContent,
  };
}

export function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
  };
}

export async function safeTool<T>(handler: () => Promise<T> | T) {
  try {
    return await handler();
  } catch (error) {
    return toolError(error);
  }
}
