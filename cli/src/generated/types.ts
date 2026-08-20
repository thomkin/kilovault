// AUTO-GENERATED — do not edit by hand
// This file contains all types needed by the generated client.

// ── Shared service types ───────────────────────────────────────────────────
export enum RpcErrorCode {
    InvalidRequest = 100,
    InvalidMethod = 101,
    MethodNotFound = 102,
    Unauthorized = 103,
    Forbidden = 104,
    ValidationError = 105,
    InternalError = 500
}
export interface RpcResponse<TOutput = unknown> {
    error?: RpcErrorCode | string;
    message?: string;
    result?: TOutput;
}
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

// ── Service 0: auth.getToken ──────────────────────────────────────────
export interface Req_0 {
    secret: string;
    userId: string;
    permissions?: _Ext_node_modules__pnpm_typescript_5_9_3_node_modules_typescript_lib_lib_es5_d_ts_Record<string, boolean>;
    expiresIn?: number; // Optional token expiration in seconds
}
/**
 * Construct a type with a set of properties K of type T
 */
type _Ext_node_modules__pnpm_typescript_5_9_3_node_modules_typescript_lib_lib_es5_d_ts_Record<K extends keyof any, T> = {
    [P in K]: T;
};
export interface Res_0 {
    token: string;
}

// ── Service 1: history.cleanup ──────────────────────────────────────────
export interface Req_1 {
}
export interface Res_1 {
    count: number;
}

// ── Service 2: history.get ──────────────────────────────────────────
export interface Req_2 {
    userId?: string;
}
export interface Res_2 {
    history: {
        id: string;
        key: string;
        type: string;
        createdAt: string;
        userId: string;
    }[];
}

// ── Service 3: system.alive ──────────────────────────────────────────
export interface Req_3 {
}
export interface Res_3 {
    timestamp: number;
}

// ── Service 4: vault.admin.delete ──────────────────────────────────────────
export interface Req_4 {
    userId: string;
    key: string;
}
export interface Res_4 {
    deleted: boolean;
}

// ── Service 5: vault.admin.get ──────────────────────────────────────────
export interface Req_5 {
    userId: string;
    key: string;
}
export interface Res_5 {
    value: string | undefined;
}

// ── Service 6: vault.admin.list ──────────────────────────────────────────
export interface Req_6 {
    userId?: string;
}
export interface Res_6 {
    keys: Array<{
        key: string;
        userId: string;
    }>;
}

// ── Service 7: vault.admin.set ──────────────────────────────────────────
export interface Req_7 {
    userId: string;
    key: string;
    value: string;
}
export interface Res_7 {
}

// ── Service 8: vault.get ──────────────────────────────────────────
export interface Req_8 {
    key: string;
}
export interface Res_8 {
    value: string | undefined;
}

// ── Service 9: vault.set ──────────────────────────────────────────
export interface Req_9 {
    key: string;
    value: string;
}
export interface Res_9 {
}
