
import useSWR from 'swr';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        (error as any).info = await res.json();
        (error as any).status = res.status;
        throw error;
    }
    return res.json();
};

export function useUniversalData(tableName: string, options?: { refreshInterval?: number }) {
    const { data, error, isLoading } = useSWR(tableName ? `/universal/${tableName}` : null, fetcher, {
        refreshInterval: options?.refreshInterval || 0 // Default: 0 (No auto-refresh)
    });

    return {
        data: Array.isArray(data) ? data : [],
        isLoading,
        error
    };
}
