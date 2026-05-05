#!/usr/bin/env node

import { Command } from 'commander';
import { generate } from '../dist/commands/generate.js';
import { init } from '../dist/commands/init.js';

const program = new Command();

program
  .name('ttt')
  .description('TicketToTest CLI - Generate test cases from ticket descriptions')
  .version('0.1.2');

program
  .command('init')
  .description('Initialize TicketToTest CLI configuration')
  .option('-f, --force', 'Force overwrite existing configuration')
  .action(init);

program
  .command('generate')
  .description('Generate test code from a ticket description')
  .argument('<ticket-id>', 'Ticket ID to generate tests from (e.g., SCRUM-5)')
  .option('-l, --language <lang>', 'Programming language for generated tests', 'typescript')
  .option('-f, --framework <framework>', 'Test framework: playwright|robot|cypress|selenium', 'playwright')
  .option('-o, --output <path>', 'Output file path (auto-detected from framework if not provided)')
  .option('-u, --url <url>', 'TicketToTest API URL', 'https://api.tickettotest.com')
  .option('-k, --api-key <key>', 'License key for authentication')
  .action(generate);

program.parse(process.argv);
