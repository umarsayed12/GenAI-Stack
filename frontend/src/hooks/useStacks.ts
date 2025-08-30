import { useState, useCallback } from "react";

export type Stack = {
  id: number;
  name: string;
  description: string | null;
  workflow_data?: any;
};

export type CreateStackData = {
  name: string;
  description: string | null;
};

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const API_URL = `${backendUrl}/api/v1/stacks/`;

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
      setStacks((prevStacks) => [newStack, ...prevStacks]);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
      throw err;
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
      setStacks((prevStacks) =>
        prevStacks.filter((stack) => stack.id !== stackId)
      );
    } catch (err: any) {
      console.error("Error deleting stack:", err.message);
      throw err;
    }
  };

  return { stacks, isLoading, error, fetchStacks, createStack, deleteStack };
};
