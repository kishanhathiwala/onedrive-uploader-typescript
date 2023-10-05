import { PublicClientApplication, Configuration, DeviceCodeRequest, AuthenticationResult, SilentFlowRequest, LogLevel } from '@azure/msal-node';
import { AccessTokenProvider, AllowedHostsValidator } from "@microsoft/kiota-abstractions";

import myCachePlugin from './myCachePlugin';

type myAccessTokenProviderOptions = {
    clientId: string,
    tenantId: string,
    tokenFileName: string,
    scopes: string[],
    accountName: string,
    authority: string
};

export default class myAccessTokenProvider implements AccessTokenProvider {
    constructor(public options: myAccessTokenProviderOptions) {
    }
    getAuthorizationToken = (url?: string | undefined): Promise<string> => {
        return this.generateTokenAsync();
    };

    getAllowedHostsValidator = () => new AllowedHostsValidator();

    public generateTokenAsync = async () => {
        const configuration: Configuration = {
            auth: {
                clientId: this.options.clientId,
                authority: `${this.options.authority}/${this.options.tenantId}`
            }, cache: {
                claimsBasedCachingEnabled: true,
                cachePlugin: new myCachePlugin(this.options.tokenFileName)
            }, system: {
                loggerOptions: {
                    loggerCallback(logLevel, message, containsPii) {
                        console.log(`${message}`);
                    },
                    piiLoggingEnabled: false,
                    logLevel: LogLevel.Error
                }
            }
        };

        const app = new PublicClientApplication(configuration);
        const accounts = await app.getAllAccounts();
        let result: AuthenticationResult | null;

        if (!accounts || accounts.length == 0) {
            const deviceCodeRequest: DeviceCodeRequest = {
                scopes: this.options.scopes,
                deviceCodeCallback: (response) => {
                    console.log(response.message);
                }
            };
            result = await app.acquireTokenByDeviceCode(deviceCodeRequest);
        } else {
            const silentFlowRequest: SilentFlowRequest = {
                scopes: this.options.scopes,
                account: accounts[0]
            };
            result = await app.acquireTokenSilent(silentFlowRequest);
        }

        return result!.accessToken;
    }
}