"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface WorkflowItem {
    id: string;
    title: string;
    department: "Sales" | "HR" | "Finance" | "Marketing";
    createdAt: string;
    description: string;
    requiresInput?: boolean;
    // Enhanced Input Definition
    inputs?: {
        key: string;
        label: string;
        type: "text" | "number" | "date" | "file" | "image";
        required?: boolean;
    }[];
}

interface WorkflowContextType {
    workflows: WorkflowItem[];
    addWorkflow: (workflow: WorkflowItem) => void;
    removeWorkflow: (id: string) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
    const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("n8n-workflows");
        if (saved) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setWorkflows(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse workflows", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever workflows change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("n8n-workflows", JSON.stringify(workflows));
        }
    }, [workflows, isLoaded]);

    const addWorkflow = (workflow: WorkflowItem) => {
        setWorkflows((prev) => [workflow, ...prev]);
    };

    const removeWorkflow = (id: string) => {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
    };

    return (
        <WorkflowContext.Provider value={{ workflows, addWorkflow, removeWorkflow }}>
            {children}
        </WorkflowContext.Provider>
    );
}

export function useWorkflow() {
    const context = useContext(WorkflowContext);
    if (context === undefined) {
        throw new Error("useWorkflow must be used within a WorkflowProvider");
    }
    return context;
}
