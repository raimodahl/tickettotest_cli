#!/usr/bin/env node

import { Command } from 'commander';
import { generate } from '../dist/commands/generate.js';

const program = new Command();

program
  .name('ttt')
  .description('TicketToTest CLI - Generate test cases from ticket descriptions')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate test code from a ticket description')
  .argument('<ticket-id>', 'Ticket ID to generate tests from (e.g. SCRUM-5)')
  .option('-t, --ticket-id <id>', 'Ticket ID (deprecated, use positional argument instead)')
  .option('-d, --description <text>', 'Ticket description text (mutually exclusive with --ticket-id)')
  .option('-l, --language <lang>', 'Programming language for generated tests', 'typescript')
  .option('-f, --framework <framework>', 'Test framework: playwright|robot|cypress|selenium', 'playwright')
  .option('-o, --output <path>', 'Output file path (auto-detected from framework if not provided)')
  .option('-u, --url <url>', 'TicketToTest API URL', 'https://api.tickettotest.com')
  .option('-k, --api-key <key>', 'API key for authentication')
  .action(async (ticketId, options) => {
    // Use positional argument ticketId, or fall back to --ticket-id option for backward compatibility
    const ticketIdValue = ticketId || options.ticketId;
    await generate({
      ...options,
      ticketId: ticketIdValue,
    });
  });

program.parse(process.argv);
