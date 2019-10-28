import tl = require('azure-pipelines-task-lib/task');
import { GraphApiClient} from './graph-api-access/graphApiClient';

async function run() {
    try {
        const inputString: string | undefined = tl.getInput('samplestring', true);
        if (inputString == 'bad') {
            tl.setResult(tl.TaskResult.Failed, 'Bad input was given');
            return;
        }

        const serviceNameInput: string | undefined = tl.getInput("environmentServiceName", true);
        const serviceName: string = serviceNameInput ? serviceNameInput : "";

        const secret = tl.getEndpointAuthorizationParameter(serviceName, "serviceprincipalkey", true);
        const safeSecret = secret ? secret.length < 4 ? "****" + secret : secret : "*****";
        console.log('client_id', tl.getEndpointAuthorizationParameter(serviceName, "serviceprincipalid", true));
        console.log('client_secret', safeSecret.substring(0, 4));
        console.log('tenant_id', tl.getEndpointAuthorizationParameter(serviceName, "tenantid", true));
        console.log('Hello', inputString);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();