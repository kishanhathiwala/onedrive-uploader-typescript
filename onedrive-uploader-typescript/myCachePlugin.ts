import * as fs from 'fs';
import { ICachePlugin, TokenCacheContext } from '@azure/msal-common';

export default class myCachePlugin implements ICachePlugin {
    constructor(public cacheLocation: string) {
    }

    beforeCacheAccess = (tokenCacheContext: TokenCacheContext): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(this.cacheLocation)) {
                fs.readFile(this.cacheLocation, "utf-8", (err, data) => {
                    if (err) {
                        reject();
                    } else {
                        tokenCacheContext.tokenCache.deserialize(data);
                        resolve();
                    }
                });
            } else {
                fs.writeFile(this.cacheLocation, tokenCacheContext.tokenCache.serialize(), (err) => {
                    if (err) {
                        reject();
                    }
                });
            }
        });
    };

    afterCacheAccess = (tokenCacheContext: TokenCacheContext): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (tokenCacheContext.cacheHasChanged) {
                fs.writeFile(this.cacheLocation, tokenCacheContext.tokenCache.serialize(), (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    };
}