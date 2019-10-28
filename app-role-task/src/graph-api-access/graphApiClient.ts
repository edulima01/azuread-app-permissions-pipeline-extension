import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import tl from 'azure-pipelines-task-lib/task';
import { AxiosInstance } from 'axios';
import qs = require('qs');

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

interface TokenResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
}

export class GraphApiClient {
    private axiosClient: AxiosInstance;
    private token: any;
    private tokenError: any;

    constructor() {
        this.axiosClient = axios.create();
    }

    private async getToken(): Promise<void> {
        const tokenEndpoint = `https://login.microsoftonline.com/${tl.getEndpointDataParameter("environmentServiceName", "tenant_id", false)}/oauth2/v2.0/token`;
        if (!this.token || this.isExpired()) {
            const postData = {
                client_id: tl.getEndpointDataParameter("environmentServiceName", "client_id", false),
                scope: "https://graph.microsoft.com/.default",
                client_secret: tl.getEndpointDataParameter("environmentServiceName", "client_secret", false),
                grant_type: 'client_credentials'
            };
            this.token = (await this.axiosClient.post<TokenResponse>(tokenEndpoint, qs.stringify(postData))).data.access_token;
        }
    }

    private isExpired(): boolean {
        return false;
    }

    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        this.getToken();
        return Promise.resolve((await this.axiosClient.get<T>(url, config)).data);
    }

    public async post<T, D>(url: string, data: D, config?: AxiosRequestConfig): Promise<T> {
        this.getToken();
        return Promise.resolve((await this.axiosClient.post<T>(url, data, config)).data);
    }
}