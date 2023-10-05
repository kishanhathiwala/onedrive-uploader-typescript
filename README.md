# onedrive-uploader-typescript
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
