const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY,
};

export interface Issue {
    type: string;
    severity: "high" | "medium" | "low";
    explanation: string;
    fix: string;
}

export interface DiagnosticResponse {
    session_id: string;
    score: number;
    summary: string;
    issues: Issue[];
    original_output: string;
    suggested_prompt: string;
    improved_output: string | null;
    response_time_ms: number;
    saved: boolean;
}

export interface SessionListItem {
    session_id: string;
    session_label: string | null;
    created_at: string;
    input_mode: string;
    score: number;
    summary: string;
    issue_count: number;
}

export interface StatsResponse {
    total_sessions: number;
    avg_score: number | null;
    avg_response_time_ms: number | null;
    top_issues: { type: string; count: number; pct_of_sessions: number }[];
    avg_score_by_mode: Record<string, number>;
}

export interface IssueDetail extends Issue {
    id: string;
}

export interface SessionDetail {
    id: string;
    session_id: string;
    created_at: string;
    session_label: string | null;
    original_prompt: string;
    test_input: string;
    input_mode: "prompt" | "n8n_workflow";
    model_used: string;
    score: number | null;
    summary: string | null;
    original_output: string | null;
    suggested_prompt: string | null;
    improved_output: string | null;
    response_time_ms: number | null;
    issues: IssueDetail[];
}

export async function runDiagnostic(payload: {
    original_prompt: string;
    test_input: string;
    input_mode?: "prompt" | "n8n_workflow";
    session_label?: string;
}): Promise<DiagnosticResponse> {
    const res = await fetch(`${API_URL}/diagnostics`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`${res.status}: ${err.detail || "Request failed"}`);
    }
    return res.json();
}

export async function listSessions(limit = 20): Promise<SessionListItem[]> {
    const res = await fetch(`${API_URL}/diagnostics?limit=${limit}`, { headers });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data = await res.json();
    return data.sessions;
}

export async function getSession(sessionId: string): Promise<SessionDetail> {
    const res = await fetch(`${API_URL}/diagnostics/${sessionId}`, { headers });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data = await res.json();
    // GET /diagnostics/{id} returns "id", not "session_id" - normalise here
    // so the rest of the frontend only ever deals with "session_id"
    return { ...data, session_id: data.id };
}

export async function getStats(): Promise<StatsResponse> {
    const res = await fetch(`${API_URL}/diagnostics/stats`, { headers });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
}

export function getErrorMessage(error: Error): string {
    const msg = error.message;

    if (msg.includes("503")) {
        return "The diagnostic service is temporarily unavailable - Claude may be experiencing high load. Try again in a moment.";
    }
    if (msg.includes("422")) {
        return "Check your input: the prompt needs at least 10 characters and the test input at least 3.";
    }
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        return "Couldn't reach the diagnostic API. Check your connection or try again shortly.";
    }
    return msg || "Something went wrong running the diagnostic.";
}