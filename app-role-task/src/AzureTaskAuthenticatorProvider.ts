import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import tl from 'azure-pipelines-task-lib/task';
import { AxiosInstance } from 'axios';
import qs = require('qs');
import { AuthenticationProvider, AuthenticationProviderOptions } from '@microsoft/microsoft-graph-client';

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

interface TokenResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
}

export class AzureTaskAuthenticatorProvider implements AuthenticationProvider {
    private axiosClient: AxiosInstance;
    private token: any;
    private authenticationProviderOptions: { scopes: string[] } = {
        scopes: [ "https://graph.microsoft.com/.default" ]
    };

    constructor() {
        this.axiosClient = axios.create();
    }

    private async getToken(authenticationProviderOptions: AuthenticationProviderOptions | undefined): Promise<void> {
        tl.debug("Starting getToken");
        const scopesChanged = this.scopesChanged(authenticationProviderOptions);
        if (!this.token || this.isExpired() || scopesChanged) {
            tl.debug("getting service name");
            const serviceNameInput: string | undefined = tl.getInput("environmentServiceName", true);
            const serviceName: string = serviceNameInput ? serviceNameInput : "";
    
            tl.debug("getting client id");
            const clientId = tl.getEndpointAuthorizationParameter(serviceName, "serviceprincipalid", false);
            tl.debug("getting client secret");
            const clientSecret = tl.getEndpointAuthorizationParameter(serviceName, "serviceprincipalkey", false);
            tl.debug("getting tenant id");
            const tenantId = tl.getEndpointAuthorizationParameter(serviceName, "tenantid", false);
            const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
            tl.debug("scopes: " + this.authenticationProviderOptions.scopes.join(" "));
            const postData = {
                client_id: clientId,
                scope: this.authenticationProviderOptions.scopes.join(" "),
                client_secret: clientSecret,
                grant_type: 'client_credentials'
            };
            this.token = (await this.axiosClient.post<TokenResponse>(tokenEndpoint, qs.stringify(postData))).data.access_token;
            tl.debug("access_token: " + this.token);
        }
        tl.debug("Finished get token");
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
}