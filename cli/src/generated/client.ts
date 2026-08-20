// AUTO-GENERATED — do not edit by hand
import ky from 'ky';
import type { Req_0, Res_0, Req_1, Res_1, Req_2, Res_2, Req_3, Res_3, Req_4, Res_4, Req_5, Res_5, Req_6, Res_6, Req_7, Res_7, Req_8, Res_8, Req_9, Res_9, RpcResponse } from './types';

export interface ClientConfig {
  baseUrl: string;
  token?: string;
}

export class ServiceClient {
  private api: typeof ky;
  private token?: string;

  constructor(config: ClientConfig) {
    this.token = config.token;
    this.api = ky.create({
      prefixUrl: config.baseUrl,
      throwHttpErrors: false,
      hooks: {
        beforeRequest: [
          (request) => {
            if (this.token) {
              request.headers.set('Authorization', `Bearer ${this.token}`);
            }
          },
        ],
      },
    });
  }

  setToken(token: string) {
    this.token = token;
  }

  public readonly rpc = {
    auth: {
      getToken: async (params: Req_0): Promise<RpcResponse<Res_0>> => {
        const res = await this.api.post('rpc', {
          json: { method: "auth.getToken", params, token: this.token }
        }).json<any>();
        return res;
      },
    },
    history: {
      cleanup: async (params: Req_1): Promise<RpcResponse<Res_1>> => {
        const res = await this.api.post('rpc', {
          json: { method: "history.cleanup", params, token: this.token }
        }).json<any>();
        return res;
      },
      get: async (params: Req_2): Promise<RpcResponse<Res_2>> => {
        const res = await this.api.post('rpc', {
          json: { method: "history.get", params, token: this.token }
        }).json<any>();
        return res;
      },
    },
    system: {
      alive: async (params: Req_3): Promise<RpcResponse<Res_3>> => {
        const res = await this.api.post('rpc', {
          json: { method: "system.alive", params, token: this.token }
        }).json<any>();
        return res;
      },
    },
    vault: {
      admin: {
        delete: async (params: Req_4): Promise<RpcResponse<Res_4>> => {
          const res = await this.api.post('rpc', {
            json: { method: "vault.admin.delete", params, token: this.token }
          }).json<any>();
          return res;
        },
        get: async (params: Req_5): Promise<RpcResponse<Res_5>> => {
          const res = await this.api.post('rpc', {
            json: { method: "vault.admin.get", params, token: this.token }
          }).json<any>();
          return res;
        },
        list: async (params: Req_6): Promise<RpcResponse<Res_6>> => {
          const res = await this.api.post('rpc', {
            json: { method: "vault.admin.list", params, token: this.token }
          }).json<any>();
          return res;
        },
        set: async (params: Req_7): Promise<RpcResponse<Res_7>> => {
          const res = await this.api.post('rpc', {
            json: { method: "vault.admin.set", params, token: this.token }
          }).json<any>();
          return res;
        },
      },
      get: async (params: Req_8): Promise<RpcResponse<Res_8>> => {
        const res = await this.api.post('rpc', {
          json: { method: "vault.get", params, token: this.token }
        }).json<any>();
        return res;
      },
      set: async (params: Req_9): Promise<RpcResponse<Res_9>> => {
        const res = await this.api.post('rpc', {
          json: { method: "vault.set", params, token: this.token }
        }).json<any>();
        return res;
      },
    },
  };

  public readonly crud = {
  };
}

export function init(config: ClientConfig) {
  return new ServiceClient(config);
}
