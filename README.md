# onedrive-uploader-typescript
## prerequisites
1. login in https://portal.azure.com (this is free if you are going to create an app in portal.azure.com)
2. navigate to Microsoft Entra ID
![image](https://github.com/pfeux/onedrive-uploader-typescript/assets/29030616/23525291-db71-4d36-91bf-e4950c40e4ee)
3. navigate to `App registrations` -> `New registration`
4. give a name and select the following option. you can leave redirect uri empty
![image](https://github.com/pfeux/onedrive-uploader-typescript/assets/29030616/90644404-944b-4824-9048-ecc721ce59db)
5. once app registration is successful, nagive to api permission and add these permissions and make sure you `grant admin concent`
![image](https://github.com/pfeux/onedrive-uploader-typescript/assets/29030616/84d3af8d-a866-4c9b-97db-8af809192b3d)
6. nagivate to overview and copy `Application (client) ID` and if you are going to connect your **onedrive for personal**, use `consumers` as your tenantId and else copy the `Directory (tenant) ID`.

## building
1. i am using node v20.7.0
2. clone the repo
3. Enter your `clientId` and `tenantId` in `onedriveConfig.json`. If you are connecting **onedrive for personal**, then use `consumers` as your tenantId.
4. run `npm install`
5. run `npm run build` or `npm run publish`

## running
1. run `node dist/bundle.js "<folder>"` - this will upload all the files from this and its subfolders on root folder of your onedrive. If the same file is found, it will compare the file size and then rename if file size don't match
2. you will need to put the device code shown in your terminal to login. This will create a `token.json` file in dist folder and it will use that file for refresh token.

## bug
1. if you are running the code for the first time, it will exit after creating the `token.json` file. Re-run the app and it will work. PR are welcomed for the fix.
