/**
 * 统一 HTTP JSON 响应结构（与 HTTP status 一致时 body.statusCode 与之相同）。
 *
 * 成功：statusCode + msg + data + meta
 * 失败：statusCode + msg + data=null + error（机器码与详情）
 */
export type ApiMeta = {
  requestId?: string;
  ts?: number;
  pagination?: { page: number; limit: number; total: number };
} & Record<string, unknown>;

export type ApiSuccessEnvelope<T> = {
  statusCode: number;
  msg: string;
  data: T;
  meta: ApiMeta;
};

export type ApiErrorEnvelope = {
  statusCode: number;
  msg: string;
  data: null;
  error: {
    code: string;
    details: Record<string, unknown>;
    requestId?: string;
  };
};
