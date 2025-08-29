import { useState, useCallback } from "react";

// The full stack type including workflow data for optimistic updates
export type Stack = {
  id: number;
  name: string;
  description: string | null;
  workflow_data?: any; // Optional, as it's not always needed
};

export type CreateStackData = {
  name: string;
  description: string | null;
};

// Reverting to a hardcoded URL to resolve the import.meta warning for now.
const API_URL = "http://127.0.0.1:8000/api/v1/stacks/";

export const useStacks = () => {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStacks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch stacks");
      }
      const data: Stack[] = await response.json();
      setStacks(data);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createStack = async (stackData: CreateStackData) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...stackData,
          // Start with a clean, empty workflow
          workflow_data: {
            nodes: [],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create stack");
      }

      const newStack: Stack = await response.json();

      // Optimistic Update: Add the new stack to the local state directly
      setStacks((prevStacks) => [newStack, ...prevStacks]);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
      throw err; // Re-throw the error so the component can handle it
    }
  };

  const deleteStack = async (stackId: number) => {
    try {
      const response = await fetch(`${API_URL}${stackId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete stack");
      }

      // Optimistic Update: Remove the stack from the local state directly
      setStacks((prevStacks) =>
        prevStacks.filter((stack) => stack.id !== stackId)
      );
    } catch (err: any) {
      console.error("Error deleting stack:", err.message);
      throw err; // Re-throw the error so the component can handle it
    }
  };

  return { stacks, isLoading, error, fetchStacks, createStack, deleteStack };
};
