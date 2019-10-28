import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import tl from 'azure-pipelines-task-lib/task';
import { AxiosInstance } from 'axios';
import qs from 'qs';
import { AuthenticationProvider, AuthenticationProviderOptions } from '@microsoft/microsoft-graph-client';

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

interface TokenResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
}

export interface ServiceProvider {
    clientId: string,
    clientSecret: string,
    tenantId: string
}

export class AzureTaskAuthenticatorProvider implements AuthenticationProvider {
    private axiosClient: AxiosInstance;
    private token: any;
    private authenticationProviderOptions: { scopes: string[] } = {
        scopes: [ "https://graph.microsoft.com/.default" ]
    };

    constructor(private serviceProvider: ServiceProvider, private debugLogger?: (message: string) => void) {
        this.axiosClient = axios.create();
    }

    private async getToken(authenticationProviderOptions: AuthenticationProviderOptions | undefined): Promise<void> {
        this.log("Starting getToken");
        const scopesChanged = this.scopesChanged(authenticationProviderOptions);
        if (!this.token || this.isExpired() || scopesChanged) {
            this.log("scopes: " + this.authenticationProviderOptions.scopes.join(" "));
            const postData = {
                client_id: this.serviceProvider.clientId,
                scope: this.authenticationProviderOptions.scopes.join(" "),
                client_secret: this.serviceProvider.clientSecret,
                grant_type: 'client_credentials'
            };
            this.token = (await this.axiosClient.post<TokenResponse>(`https://login.microsoftonline.com/${this.serviceProvider.tenantId}/oauth2/v2.0/token`, qs.stringify(postData))).data.access_token;
            this.log("access_token: " + this.token);
        }
        this.log("Finished get token");
    }

    private isExpired(): boolean {
        return false;
    }

    private scopesChanged(authenticationProviderOptions: AuthenticationProviderOptions | undefined): boolean {
        if (!authenticationProviderOptions || !authenticationProviderOptions.scopes) {
            return true;
        }

        const areSame = this.authenticationProviderOptions.scopes.every((scope) => 
            authenticationProviderOptions.scopes && authenticationProviderOptions.scopes.some(other => other == scope)
        );

        if (!areSame) {
            this.authenticationProviderOptions.scopes = authenticationProviderOptions.scopes;
        }

        return areSame;
    }

    public async getAccessToken(authenticationProviderOptions?: AuthenticationProviderOptions | undefined): Promise<string> {
        await this.getToken(authenticationProviderOptions);
        return Promise.resolve(this.token);
    }

    private log(message: string): void {
        if (this.debugLogger) {
            this.debugLogger(message);
        }
    }
}