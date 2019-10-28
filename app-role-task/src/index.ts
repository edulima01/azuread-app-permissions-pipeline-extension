import tl = require('azure-pipelines-task-lib/task');
import { AppRole } from "@microsoft/microsoft-graph-types-beta";
import { ServicePrincipalManager } from './ServicePrincipalManager';
import { v4 } from 'uuid';
import { ServiceProvider } from './AzureTaskAuthenticatorProvider';

async function run() {
    try {
        const command = tl.getInput("command", true);
        const servicePrincipalId = <string>tl.getInput("servicePrincipalId", true);
        switch(command) {
            case 'upsert':
                tl.debug("doing upsert");
                await new ServicePrincipalManager(createServiceProvider(), servicePrincipalId, (msg) => tl.debug(msg)).guaranteeTheAppRoleExists(createFromInput());
                break;
            case 'delete':
                tl.debug("doing delete");
                await new ServicePrincipalManager(createServiceProvider(), servicePrincipalId, (msg) => tl.debug(msg)).guaranteeTheAppRoleDoesntExists(getAndValidateInput("value"));
                break;
            default:
                throw new Error(`Could not understand command ${command}.`);
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

function createServiceProvider(): ServiceProvider {
    tl.debug("getting service name");
    const serviceName: string = <string>tl.getInput("environmentServiceName", true);

    tl.debug("getting client id");
    const clientId = <string>tl.getEndpointAuthorizationParameter(serviceName, "serviceprincipalid", false);
    tl.debug("getting client secret");
    const clientSecret = <string>tl.getEndpointAuthorizationParameter(serviceName, "serviceprincipalkey", false);
    tl.debug("getting tenant id");
    const tenantId = <string>tl.getEndpointAuthorizationParameter(serviceName, "tenantid", false);
    return {
        clientId, clientSecret, tenantId
    };
}

function createFromInput(): AppRole {
    const allowedMemberTypes = tl.getDelimitedInput("allowedMemberTypes", "\n", true);
    if (allowedMemberTypes.some(memberType => memberType != "User" && memberType != "Application")) {
        throw new Error (`The allowedMemberTypes field only supports the values "User" and "Application", but received ${allowedMemberTypes.join(" ")}.`);
    }
    return {
        id: v4(),
        allowedMemberTypes: allowedMemberTypes,
        description: tl.getInput("description", true),
        displayName: getAndValidateInput("displayName"),
        isEnabled: tl.getBoolInput("appRoleEnabledFlag", true),
        value: getAndValidateInput("value")
    };
}

function getAndValidateInput(inputName: string): string {
    const inputValue = <string>tl.getInput(inputName, true);
    if (/\s/.test(inputValue)) {
        throw new Error(`Property ${inputName} contains white space characters: "${inputValue}"`);
    }
    return inputValue;
}

run();