import * as vscode from 'vscode';

import {
    prodConfig,
    devConfig,
    qaConfig,
    mainProdConfig,
    featureBranchProdConfig
} from "./fakeData";

type Config = Record<string, any>;

export function activate(context: vscode.ExtensionContext) {
    
    const output = vscode.window.createOutputChannel("Pre-Deploy Validator");

    const disposable = vscode.commands.registerCommand(
        "pre-deploy-validator.validateConfigs",
        () => {

            output.clear();
            output.appendLine("=== Pre-Deploy Validator Started ===\n");

            environmentDriftCheck(output);
            commitDriftCheck(output);
            branchConfigDriftCheck(output);
			const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
			const api = gitExtension.getAPI(1);

			// Print Repository URL
			output.appendLine("\n=== Repository Info ===");

			if (api.repositories.length > 0) {
				const repo = api.repositories[0];
				const origin = repo.state.remotes.find((r: { name: string; }) => r.name === "origin");

				const repoUrl = origin?.fetchUrl || "No remote origin found";
				output.appendLine(`📁 Repo URL: ${repoUrl}`);
			} else {
				output.appendLine("⚠ No Git repository found.");
			}
            output.appendLine("=== Validation Completed ===");
            output.show(true);

            vscode.window.showInformationMessage(
                "Validation completed. Check 'Pre-Deploy Validator' output panel."
            );
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}

// ---------------------------------------------------------
// ENVIRONMENT CONFIG COMPARISON
// ---------------------------------------------------------

function environmentDriftCheck(output: vscode.OutputChannel) {
    output.appendLine("=== ENVIRONMENT CONFIG DRIFT CHECK ===\n");

    const prodToDev = compareObjects(prodConfig, devConfig, "prod", "dev");
    const prodToQa = compareObjects(prodConfig, qaConfig, "prod", "qa");

    output.appendLine("--- PROD → DEV Issues ---");
    prodToDev.forEach(i => output.appendLine(i));
    
    output.appendLine("\n--- PROD → QA Issues ---");
    prodToQa.forEach(i => output.appendLine(i));

    output.appendLine("\nEnvironment drift check complete.\n");
}

// ---------------------------------------------------------
// COMMIT DRIFT CHECK
// ---------------------------------------------------------

function commitDriftCheck(output: vscode.OutputChannel) {
    output.appendLine("=== COMMIT DRIFT CHECK ===");

    const prodCommit = prodConfig.commit;
    const devCommit = devConfig.commit;
    const qaCommit = qaConfig.commit;

    // DEV
    if (devCommit === prodCommit) {
        output.appendLine(`✔ DEV is up-to-date with PROD (${devCommit})`);
    } else {
        output.appendLine(`❌ DEV commit (${devCommit}) is behind PROD (${prodCommit})`);
    }

    // QA
    if (qaCommit === prodCommit) {
        output.appendLine(`✔ QA is up-to-date with PROD (${qaCommit})`);
    } else {
        output.appendLine(`❌ QA commit (${qaCommit}) is behind PROD (${prodCommit})`);
    }

    output.appendLine("\nCommit drift check complete.\n");
}

// ---------------------------------------------------------
// BRANCH CONFIG CHECK
// ---------------------------------------------------------

function branchConfigDriftCheck(output: vscode.OutputChannel) {

    output.appendLine("=== BRANCH CONFIG DRIFT CHECK ===");

    const issues = compareObjects(
        mainProdConfig,
        featureBranchProdConfig,
        "main-prod",
        "feature-prod"
    );

    output.appendLine("--- MAIN PROD → FEATURE PROD Issues ---");
    issues.forEach(i => output.appendLine(i));

    output.appendLine("\nBranch drift check complete.\n");
}

// ---------------------------------------------------------
// GENERIC OBJECT COMPARISON
// ---------------------------------------------------------

function compareObjects(
    base: Config,
    target: Config,
    baseName: string,
    targetName: string,
    prefix: string = ""
): string[] {
    let issues: string[] = [];

    for (const key of Object.keys(base)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (!(key in target)) {
            issues.push(`❌ [${targetName}] Missing key: ${fullKey}`);
            continue;
        }

        if (typeof base[key] !== typeof target[key]) {
            issues.push(
                `⚠️ [${targetName}] Type mismatch on ${fullKey}: expected "${typeof base[key]}", got "${typeof target[key]}"`
            );
        }

        if (typeof base[key] === "object" && base[key] !== null) {
            issues.push(
                ...compareObjects(base[key], target[key], baseName, targetName, fullKey)
            );
        }
    }

    for (const key of Object.keys(target)) {
        if (!(key in base)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            issues.push(`⚠️ [${targetName}] Extra key: ${fullKey}`);
        }
    }

    return issues;
}
