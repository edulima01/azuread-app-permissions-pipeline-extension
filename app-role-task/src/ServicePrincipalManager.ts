import { AppRole } from '@microsoft/microsoft-graph-types-beta';
import { Client, GraphRequest } from '@microsoft/microsoft-graph-client';
import { AzureTaskAuthenticatorProvider } from './AzureTaskAuthenticatorProvider';
import 'isomorphic-fetch';

export class ServicePrincipalManager {
    private graphApiClient: Client;
    constructor(private servicePrincipalClientId: string, private debugLogger?: (message: string) => void) {
        this.graphApiClient = Client.initWithMiddleware({
            authProvider: new AzureTaskAuthenticatorProvider(this.debugLogger)
        });
    }

    public async guaranteeTheAppRoleExists(appRole: AppRole): Promise<void> {
        const appRoles = await this.listExistingRoles();
        const existingRole = appRoles.find(role => role.value == appRole.value);
        if (!existingRole) {
            this.log(`guaranteeTheAppRoleExists: didn't found role ${appRole.value}`);
            appRoles.push(appRole);
        }
        else {
            Object.assign(existingRole, Object.assign(appRole, {id: existingRole.id}));
            this.log(`guaranteeTheAppRoleExists: found role ${appRole.value}: ${JSON.stringify(existingRole)}`);
        }
        await this.createRequest().patch({appRoles});
    }

    public async guaranteeTheAppRoleDoesntExists(appRoleValue: string): Promise<void> {
        const appRoles = await this.listExistingRoles();
        const roleIndex = appRoles.findIndex(appRole => appRole.value == appRoleValue);
        if (roleIndex == -1) {
            this.log(`guaranteeTheAppRoleDoesntExists: app role ${appRoleValue} already does not exists. Nothing updated.`);
            return;
        }

        appRoles.splice(roleIndex, 1);
        await this.createRequest().patch({appRoles});
    }

    private async listExistingRoles(): Promise<AppRole[]> {
        return (await this.createRequest().get()).appRoles;
    }

    private createRequest(): GraphRequest {
        return this.graphApiClient.api(`/servicePrincipals/${this.servicePrincipalClientId}`).version("beta");
    }

    private log(message: string) {
        if (this.debugLogger) {
            this.debugLogger(message);
        }
    }
}