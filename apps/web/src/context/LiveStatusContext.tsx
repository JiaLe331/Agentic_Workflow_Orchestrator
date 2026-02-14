"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { LiveLog, LiveStatusStep } from "@/components/LiveWorkflowStatus";
import { useWorkflows } from "@/hooks/use-workflows";
import { useRouter } from "next/navigation";

interface LiveStatusContextType {
    liveLogs: LiveLog[];
    currentStep: LiveStatusStep | null;
    generationResult: any | null;
    isGenerating: boolean;
    isOpen: boolean;
    isCollapsed: boolean;
    generateAgent: (prompt: string) => Promise<void>;
    closeLiveStatus: () => void;
    toggleCollapse: () => void;
    setCollapsed: (collapsed: boolean) => void;
    expand: () => void;
}

const LiveStatusContext = createContext<LiveStatusContextType | undefined>(undefined);

export function LiveStatusProvider({ children }: { children: React.ReactNode }) {
    const [liveLogs, setLiveLogs] = useState<LiveLog[]>([]);
    const [currentStep, setCurrentStep] = useState<LiveStatusStep | null>(null);
    const [generationResult, setGenerationResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const webSocketRef = useRef<WebSocket | null>(null);

    const { generate } = useWorkflows();
    const router = useRouter();

    const connectWebSocket = useCallback((clientId: string) => {
        // Determine WS URL (assume localhost:8000 for now, or use logic to match API_URL)
        const wsUrl = `ws://localhost:8000/ws/${clientId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Connected to WebSocket");
            setLiveLogs(prev => [...prev, { type: 'log', data: 'Connected to server...', timestamp: Date.now() }]);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                setLiveLogs(prev => [...prev, { ...message, timestamp: Date.now() }]);

                if (message.type === 'step') {
                    setCurrentStep(message.status);
                    if (message.status === 'executed' && message.data?.result) {
                        setGenerationResult(message.data.result);
                        setIsGenerating(false); // Stop generating when executed
                    }
                } else if (message.type === 'log') {
                    // Just logging
                } else if (message.type === 'complete') {
                    // Auto-redirect after a short delay
                    setTimeout(() => {
                        closeLiveStatus();
                    }, 2000);
                }
            } catch (e) {
                console.error("Error parsing WS message", e);
            }
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
        };

        webSocketRef.current = ws;
    }, []);

    const generateAgent = useCallback(async (prompt: string) => {
        if (!prompt.trim()) return;

        // Reset state
        setIsGenerating(true);
        setLiveLogs([]);
        setCurrentStep('intent_analyzed'); // Start at first step visually
        setGenerationResult(null);
        setIsOpen(true); // Open the modal immediately
        setIsCollapsed(false); // Ensure it starts expanded

        const clientId = crypto.randomUUID();
        connectWebSocket(clientId);

        try {
            await generate(prompt, clientId);
        } catch (e) {
            console.error(e);
            setLiveLogs(prev => [...prev, { type: 'log', data: `Error: ${e}`, timestamp: Date.now() }]);
            setIsGenerating(false);
        }
    }, [generate, connectWebSocket]);

    const closeLiveStatus = useCallback(() => {
        setIsOpen(false);
        setIsGenerating(false);
        if (webSocketRef.current) {
            webSocketRef.current.close();
        }
        // Redirect if successful
        if (generationResult) {
            router.push("/collections");
        }
    }, [generationResult, router]);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const setCollapsed = useCallback((collapsed: boolean) => {
        setIsCollapsed(collapsed);
    }, []);

    const expand = useCallback(() => {
        setIsCollapsed(false);
    }, []);

    // Clean up WS on unmount
    useEffect(() => {
        return () => {
            if (webSocketRef.current) {
                webSocketRef.current.close();
            }
        };
    }, []);

    return (
        <LiveStatusContext.Provider value={{
            liveLogs,
            currentStep,
            generationResult,
            isGenerating,
            isOpen,
            isCollapsed,
            generateAgent,
            closeLiveStatus,
            toggleCollapse,
            setCollapsed,
            expand
        }}>
            {children}
        </LiveStatusContext.Provider>
    );
}

export function useLiveStatus() {
    const context = useContext(LiveStatusContext);
    if (context === undefined) {
        throw new Error("useLiveStatus must be used within a LiveStatusProvider");
    }
    return context;
}
