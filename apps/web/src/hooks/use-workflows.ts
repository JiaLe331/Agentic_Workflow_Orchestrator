
import useSWR, { mutate } from 'swr';

const API_URL = ''; // Use relative path to leverage Next.js rewrites

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        // Attach extra info to the error object.
        (error as any).info = await res.json();
        (error as any).status = res.status;
        throw error;
    }
    return res.json();
};

// Legacy format
export interface ExecutionStepLegacy {
    id: string;
    title: string;
    agent: string;
    icon: string;
    details: { label: string; value: string }[];
}

// New Node format
export interface ExecutionNode {
    id: string;
    inputs: string[];
    function: string;
    parameters: Record<string, any>;
    description: string;
    // Optional compatibility fields if mixed
    title?: string;
    agent?: string;
    icon?: string;
    details?: { label: string; value: string }[];
}


export type ExecutionStep = ExecutionStepLegacy | ExecutionNode;

export interface Workflow {
    id: string;
    nodesJson: Record<string, any>;
    title: string;
    description: string;
    tablesInvolved: string[];
    result: string;
    uiType: string;
    uiCode: string;
    workflowUrl?: string;
    webhookUrl?: string;
    userPrompt?: string;
    imageUrl?: string;
    executionPlan?: ExecutionStep[];
    inputRequirements?: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
}

export function useWorkflows() {
    const { data, error, isLoading } = useSWR<Workflow[]>(`${API_URL}/workflows`, fetcher);

    const create = async (body: any) => {
        const res = await fetch(`${API_URL}/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to create workflow');
        mutate(`${API_URL}/workflows`);
        return res.json();
    };

    const update = async (id: string, body: any) => {
        const res = await fetch(`${API_URL}/workflows/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update workflow');
        mutate(`${API_URL}/workflows`);
        return res.json();
    };

    const remove = async (id: string) => {
        const res = await fetch(`${API_URL}/workflows/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete workflow');
        mutate(`${API_URL}/workflows`);
        return res.json();
    };

    const generate = async (prompt: string, clientId?: string) => {
        const response = await fetch('/generate-workflow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, client_id: clientId }), // Updated to include client_id
        });

        if (!response.ok) {
            throw new Error('Failed to trigger workflow generation');
        }

        return response.json();
    };

    return {
        workflows: Array.isArray(data) ? data : [],
        error,
        isLoading,
        create,
        update,
        remove,
        generate
    };
}
