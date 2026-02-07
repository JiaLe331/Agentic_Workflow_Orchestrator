
import useSWR, { mutate } from 'swr';

const API_URL = 'http://localhost:4000'; // Adjust as needed

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUniversal(table: string) {
    const { data, error, isLoading } = useSWR(`${API_URL}/universal/${table}`, fetcher);

    const create = async (body: any) => {
        const res = await fetch(`${API_URL}/universal/${table}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to create');
        mutate(`${API_URL}/universal/${table}`);
        return res.json();
    };

    const update = async (id: string, body: any) => {
        const res = await fetch(`${API_URL}/universal/${table}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update');
        mutate(`${API_URL}/universal/${table}`);
        return res.json();
    };

    return {
        data,
        error,
        isLoading,
        create,
        update,
    };
}
