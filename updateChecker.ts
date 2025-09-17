import https from "https";
import version from "version.json";

const GITHUB_VERSION_FILE = 'https://raw.githubusercontent.com/Dogelix/merpaverse-manager/refs/heads/master/version.json';

async function runUpdateCheck() {
    var ghVersionJson = JSON.parse(await getGithubVersion());

    if(ghVersionJson.value !== version.value){
        console.warn(`Current version of merpaverse-manager is out of date (${version.value} < ${ghVersionJson.value}. Updating...`);
    } else {
        console.log("merpaverse-manager is up to date.");
    }
}

function getGithubVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(GITHUB_VERSION_FILE, res => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${GITHUB_VERSION_FILE}`));
                return;
            }
            let data = "";
            res.on("data", chunk => (data += chunk));
            res.on("end", () => resolve(data));
        }).on("error", reject);
    });
}