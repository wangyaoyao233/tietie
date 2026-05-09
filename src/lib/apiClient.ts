type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

/** 解析统一 API 响应，并把错误响应包装成带 code/status 的异常。 */
const parseResponse = async <T>(response: Response): Promise<T> => {
  // API 统一返回 { ok, data/error }，这里集中把服务端错误转成前端可展示的异常。
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiError | null;

  if (!payload) {
    throw new ApiClientError("服务暂时没有响应", "invalid_response", response.status);
  }

  if (!payload.ok) {
    throw new ApiClientError(payload.error.message, payload.error.code, response.status);
  }

  return payload.data;
};

/** 发起 GET 请求，并只把业务 data 返回给调用方。 */
export const apiGet = async <T>(path: string) => {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
    },
  });
  return parseResponse<T>(response);
};

/** 发起 JSON POST 请求，保持所有写接口使用同一套错误处理。 */
export const apiPost = async <T>(path: string, body: unknown) => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
};
