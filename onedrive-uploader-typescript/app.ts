import myAccessTokenProvider from './myAccessTokenProvider';
import { BaseBearerTokenAuthenticationProvider } from "@microsoft/kiota-abstractions";
import fs from 'fs';
import path from 'path';
import { Drive, DriveItem } from '@microsoft/msgraph-sdk-javascript/lib/src/models';
import { OneDriveLargeFileUploadOptions, OneDriveLargeFileUploadTask, Client, UploadResult } from '@microsoft/microsoft-graph-client';

const onedriveConfig = require("./onedriveConfig.json");

type fileModel = {
    path: string,
    directoryName: string
};

const readDirSync = (dirPath: string): string[] => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    const fullPaths = entries.map(entry => {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            return readDirSync(fullPath);
        } else {
            return fullPath;
        }
    });

    return fullPaths.flat();
}

const trimSpecialCharacters = (val: string): string => {
    const specialChars: string[] = [" ", "."];

    specialChars.forEach(value => {
        if (val.startsWith(value)) {
            val = val.substring(1, val.length);
        }
        if (val.endsWith(value)) {
            val = val.substring(0, val.length - 1);
        }
    });

    return val;
}

const findItemAsync = async (client: Client, filePath: string): Promise<DriveItem | undefined> => {
    try {
        const item: DriveItem | undefined = await client.api(`/me/drive/root:/${filePath}`).get();

        return item;
    } catch (err) {
        return;
    }
}

const uploadItemAsync = async (client: Client, filePath: string, onedrivePath: string, lastWriteTime: Date, creationTime: Date, size: number): Promise<DriveItem | undefined> => {
    let counter: number = 0;

    while (true) {
        const fileContent = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        const onedrivefilePath = path.dirname(onedrivePath);

        const options: OneDriveLargeFileUploadOptions = {
            fileName: fileName,
            conflictBehavior: "replace",
            rangeSize: 50 * 320 * 1024,
            uploadEventHandlers: {
                progress: (range, extraCallbackParam) => {
                    console.log(`uploading range: ${range?.minValue} - ${range?.maxValue}`)
                },
                extraCallbackParam: "none"
            },
            path: onedrivefilePath
        };

        const task = await OneDriveLargeFileUploadTask.create(client, fileContent, options);
        const uploadResult: UploadResult = await task.upload();
        const uploadedItem = uploadResult.responseBody as DriveItem;
        if (uploadedItem.size === size)
            return uploadedItem;

        if (counter > 25)
            return;

        counter++;
    }
}

const uploadFiles = async (files: string[], fileModel: fileModel) => {
    const client = Client.init({
        authProvider: new BaseBearerTokenAuthenticationProvider(new myAccessTokenProvider({
            accountName: "k",
            clientId: onedriveConfig.clientId,
            scopes: [
                "Files.Read",
                "Files.Read.All",
                "Files.Read.Selected",
                "Files.ReadWrite",
                "Files.ReadWrite.All",
                "Files.ReadWrite.AppFolder",
                "Files.ReadWrite.Selected",
                "User.Read",
                "offline_access",
                "openid",
                "profile",
                "email"
            ],
            tenantId: onedriveConfig.tenantId,
            tokenFileName: "./token.json",
            authority: onedriveConfig.authority
        }))
    });

    const drive: Drive = await client.api("/me/drive").get();
    if (!drive) {
        console.log("could not fetch the drive for this account");
    }

    const driveId = drive?.id!;
    for (const f of files) {
        let file = f;

        const stat = fs.statSync(file);
        if (stat.size == 0) {
            console.log(`skipping the file with zero length: ${file}`);
            continue;
        }

        const fileName = path.basename(file);
        const filePath = path.dirname(file);

        if (fileName.indexOf(".nomedia") > -1) {
            continue;
        }

        const trimmedFileName = trimSpecialCharacters(fileName);

        if (fileName != trimmedFileName) {
            let newFileName = trimmedFileName;
            const extension = path.extname(newFileName);
            const counter = 1;

            while (true) {
                if (fs.existsSync(path.join(filePath, newFileName))) {
                    newFileName = `${newFileName.replace(extension, "")}-${counter}${extension}`;
                } else {
                    break;
                }
            }

            fs.renameSync(file, path.join(filePath, newFileName));
            file = path.join(filePath, newFileName);
        }

        let trimmedPath = file.replace(fileModel.path, "").replace("\\", "/");
        trimmedPath = trimmedPath.startsWith("/")
            ? `${fileModel.directoryName}${trimmedPath}`
            : `${fileModel.directoryName}/${trimmedPath}`;

        if (trimmedPath.endsWith("/"))
            trimmedPath = trimmedPath.slice(0, -1);

        console.log(`processing ${trimmedPath}`);
        const item = await findItemAsync(client, trimmedPath);

        if (item && item.size === stat.size) {
            console.log(`skipping as file already uploaded: ${trimmedPath}`);

            continue;
        }

        console.log(`uploading the file: ${trimmedPath}`);
        const uploadedItem = await uploadItemAsync(client, file, trimmedPath, stat.mtime, stat.birthtime, stat.size);

        if (uploadedItem)
            console.log(`the following file was uploade: ${file}`);
        else {
            console.log(`the following file was not uploaded: ${file}`);
            fs.appendFileSync("notuploaded.txt", `${file}\n`);
        }
    }
}

console.log("starting...");
const argv = process.argv;
if (argv.length <= 2) {
    console.log("path of the folder is missing");
    process.exit();
}

argv.forEach((val, index) => {
    if (index > 2) {
        if (!fs.existsSync(val)) {
            console.log("invalid path provided");

            process.exit();
        }
    }
});
const files = readDirSync(argv[2]);
const fileModel: fileModel = {
    path: argv[2],
    directoryName: path.basename(argv[2])
};

uploadFiles(files, fileModel).then(() => {
    console.log("done");
})