import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

interface GenerateOptions {
  ticketId?: string;
  description?: string;
  language: string;
  framework?: string;
  output?: string;
  dryRun?: boolean;
  url: string;
  apiKey?: string;
}

export async function generate(options: GenerateOptions): Promise<void> {
  const { ticketId, description, language, framework, output, url, apiKey } = options;

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
    framework: options.framework || "playwright",
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
    // Call the API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await axios.post(`${url}/generate`, requestData, { headers });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    const generatedCode = response.data.code as string;
    const generatedLanguage = response.data.language as string;
    const generatedFramework = response.data.framework as string;

    const ext = options.framework === "robot" ? ".robot"
             : options.framework === "cypress" ? ".cy.ts"
             : options.framework === "selenium" ? ".java"
             : ".spec.ts";

    // Determine output path
    const outputPath = output || generateDefaultPath(ticketId, generatedFramework, ext);

    // Save the generated code
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, generatedCode, 'utf-8');

    console.log(`\nGenerated test file: ${outputPath}`);
    console.log(`Framework: ${generatedFramework}`);
    console.log(`Language: ${generatedLanguage}`);
    console.log(`Lines: ${generatedCode.split('\n').length}`);

    const runCmd = options.framework === "robot" ? "robot tests/"
               : options.framework === "cypress" ? "npx cypress run"
               : options.framework === "selenium" ? "mvn test"
               : "npx playwright test";
    console.log(`\nRun tests: ${runCmd}`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        if (status === 401) {
          throw new Error('Authentication failed. Please provide a valid API key with --api-key');
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
