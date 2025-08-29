import { useState, useCallback, useEffect } from "react";
import type { Stack } from "./useStacks"; // We can reuse the Stack type

const API_URL = "http://127.0.0.1:8000/api/v1/stacks/";

export const useStack = (stackId: string) => {
  const [stack, setStack] = useState<Stack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStack = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}${stackId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stack details");
      }
      const data: Stack = await response.json();
      setStack(data);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [stackId]);

  const updateStack = async (workflowData: any) => {
    if (!stack) return;
    try {
      const response = await fetch(`${API_URL}${stackId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stack.name,
          description: stack.description,
          workflow_data: workflowData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update stack");
      }
      // Optionally, you can refetch or just assume success
      console.log("Stack updated successfully!");
    } catch (err: any) {
      setError(err.message);
      console.error(err);
      throw err;
    }
  };

  useEffect(() => {
    if (stackId) {
      fetchStack();
    }
  }, [stackId, fetchStack]);

  return { stack, setStack, isLoading, error, updateStack, fetchStack };
};
