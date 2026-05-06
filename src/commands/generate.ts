import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

interface GenerateOptions {
  ticketId?: string;
  description?: string;
  language: string;
  framework: 'playwright' | 'robot';
  output?: string;
  url: string;
  apiKey?: string;
}

async function loadLicenseKeyFromConfig(): Promise<string | undefined> {
  const configPath = path.join(os.homedir(), '.tickettotest', 'config.json');
  try {
    if (await fs.pathExists(configPath)) {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return config.license_key;
    }
  } catch {
    // Ignore errors reading config file
  }
  return undefined;
}

export async function generate(options: GenerateOptions): Promise<void> {
  let { ticketId, description, language, framework, output, url, apiKey } = options;

  // Auto-load license key from config file if not provided
  if (!apiKey) {
    const configLicenseKey = await loadLicenseKeyFromConfig();
    if (configLicenseKey) {
      apiKey = configLicenseKey;
    }
  }

  // Validate mutually exclusive ticket ID and description
  if (!ticketId && !description) {
    throw new Error('Either --ticket-id or --description must be provided');
  }
  if (ticketId && description) {
    throw new Error('Cannot use both --ticket-id and --description at the same time');
  }

  // Build API request
  const requestData: Record<string, unknown> = {
    language,
    framework,
  };

  if (ticketId) {
    requestData.ticketId = ticketId;
  } else {
    requestData.description = description;
  }

  console.log(`Generating ${framework} tests...`);
  console.log(`Language: ${language}`);
  console.log(`Source: ${ticketId ? `Ticket ID: ${ticketId}` : 'Description'}`);

  try {
    // Call the API with x-license-key header
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['x-license-key'] = apiKey;
    }

    const response = await axios.post(`${url}/generate`, requestData, { headers });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    const generatedCode = response.data.code as string;
    const generatedLanguage = (response.data.language as string) || language;
    const generatedFramework = (response.data.framework as string) || framework;

    // Determine output file extension
    let extension: string;
    if (generatedFramework === 'robot') {
      extension = '.robot';
    } else {
      // Playwright - infer from language
      extension = getExtensionForLanguage(generatedLanguage);
    }

    // Determine output path
    const outputPath = output || generateDefaultPath(ticketId, generatedFramework, extension);

    // Save the generated code
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, generatedCode, 'utf-8');

    console.log(`\nGenerated test file: ${outputPath}`);
    console.log(`Framework: ${generatedFramework}`);
    console.log(`Language: ${generatedLanguage}`);
    console.log(`Lines: ${generatedCode.split('\n').length}`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        if (status === 401) {
          throw new Error('Authentication failed. Run "ttt init" to configure your license key.');
        } else if (status === 404) {
          throw new Error(`Ticket not found: ${ticketId}`);
        } else if (status === 422) {
          throw new Error(`Invalid request: ${JSON.stringify(data)}`);
        } else {
          throw new Error(`API error (${status}): ${JSON.stringify(data)}`);
        }
      } else if (error.request) {
        // Request made but no response received
        throw new Error(`Could not connect to API at ${url}. Please check the URL.`);
      }
    }
    throw error;
  }
}

function getExtensionForLanguage(language: string): string {
  const extensions: Record<string, string> = {
    typescript: '.ts',
    javascript: '.js',
    python: '.py',
    java: '.java',
    csharp: '.cs',
    go: '.go',
  };
  return extensions[language.toLowerCase()] || '.txt';
}

function generateDefaultPath(ticketId: string | undefined, framework: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const prefix = ticketId ? `ticket-${ticketId}` : `test-${timestamp}`;
  const folder = framework === 'robot' ? 'robot-tests' : 'playwright-tests';
  return path.join(process.cwd(), folder, `${prefix}${extension}`);
}
