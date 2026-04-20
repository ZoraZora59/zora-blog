import type { ZoraClient } from "./client.js";
import type { Admin } from "./types.js";

export interface MeResponse {
  admin: Admin;
  authMethod: "bearer" | "cookie";
}

export class AuthApi {
  constructor(private readonly client: ZoraClient) {}

  /** 验证当前 token 是否有效，返回管理员信息。需要后端 >= 0.2（/api/auth/me 端点）。 */
  me(): Promise<MeResponse> {
    return this.client.get<MeResponse>("/auth/me");
  }
}
