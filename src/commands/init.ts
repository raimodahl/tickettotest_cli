import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import * as readline from 'readline';

interface InitOptions {
  force?: boolean;
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function validateLicenseKey(key: string): boolean {
  // Format: TTT-XXXX-XXXX-XXXX
  const regex = /^TTT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return regex.test(key);
}

export async function init(options: InitOptions): Promise<void> {
  const configDir = path.join(os.homedir(), '.tickettotest');
  const configPath = path.join(configDir, 'config.json');

  // Check if config already exists
  if (await fs.pathExists(configPath) && !options.force) {
    console.log('Configuration already exists at ~/.tickettotest/config.json');
    console.log('Use --force to overwrite existing configuration.');
    return;
  }

  console.log('TicketToTest CLI Configuration\n');
  console.log('Enter your license key (format: TTT-XXXX-XXXX-XXXX):');
  let licenseKey = await prompt('License key: ');
  while (!validateLicenseKey(licenseKey.trim())) {
    console.log('Invalid format. Expected: TTT-XXXX-XXXX-XXXX');
    licenseKey = await prompt('License key: ');
  }

  console.log('\nJira Configuration:');
  const jiraUrl = await prompt('Jira URL: ');
  const jiraEmail = await prompt('Jira Email: ');
  const jiraToken = await prompt('Jira API Token: ');

  const config = {
    license_key: licenseKey.trim(),
    jira_url: jiraUrl.trim(),
    jira_email: jiraEmail.trim(),
    jira_token: jiraToken.trim(),
  };

  await fs.ensureDir(configDir);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

  console.log('\nConfiguration saved to ~/.tickettotest/config.json');
}
