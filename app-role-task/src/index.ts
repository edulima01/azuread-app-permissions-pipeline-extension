import tl = require('azure-pipelines-task-lib/task');
import { AppRole } from "@microsoft/microsoft-graph-types-beta";
import { ServicePrincipalManager } from './ServicePrincipalManager';
import { v4 } from 'uuid';

async function run() {
    try {
        tl.debug("getting command");
        const command = tl.getInput("command", true);
        tl.debug("getting service principal id");
        const servicePrincipalId = <string>tl.getInput("servicePrincipalId", true);
        switch(command) {
            case 'upsert':
                tl.debug("doing upsert");
                await new ServicePrincipalManager(servicePrincipalId, tl.debug).guaranteeTheAppRoleExists(createFromInput());
                break;
            case 'delete':
                tl.debug("doing delete");
                await new ServicePrincipalManager(servicePrincipalId, tl.debug).guaranteeTheAppRoleDoesntExists(getAndValidateInput("value"));
                break;
            default:
                throw new Error(`Could not understand command ${command}.`);
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

function createFromInput(): AppRole {
    tl.debug("getting allowedMemberTypes");
    const allowedMemberTypes = tl.getDelimitedInput("allowedMemberTypes", "\n", true);
    if (allowedMemberTypes.some(memberType => memberType != "User" && memberType != "Application")) {
        throw new Error (`The allowedMemberTypes field only supports the values "User" and "Application", but received ${allowedMemberTypes.join(" ")}.`);
    }
    tl.debug("allowedMemberTypes: " + allowedMemberTypes.join(" "));
    const id = v4();
    tl.debug("id: " + id);
    const description = tl.getInput("description", true);
    tl.debug("description: " + description);
    const displayName = tl.getInput("displayName", true);
    tl.debug("displayName: " + displayName);
    const appRoleEnabledFlag = tl.getBoolInput("appRoleEnabledFlag", true);
    tl.debug("appRoleEnabledFlag: " + appRoleEnabledFlag);
    const value = tl.getInput("value", true);
    tl.debug("value: " + value);
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