#!/usr/bin/env tsx
/**
 * Quartz Expert CLI
 * Interactive command-line interface for the Quartz Expert Agent
 */

import readline from 'readline';
import { config } from 'dotenv';

config();

const AGENT_URL = `http://localhost:${process.env.PORT || 3095}`;
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

class QuartzExpertCLI {
  private rl: readline.Interface;
  private sessionId: string;
  private history: any[] = [];

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `${COLORS.green}quartz>${COLORS.reset} `
    });
    
    this.sessionId = `cli_${Date.now()}`;
  }

  async start() {
    console.clear();
    await this.displayBanner();
    await this.checkAgentHealth();
    
    this.rl.prompt();
    
    this.rl.on('line', async (line) => {
      const input = line.trim();
      
      if (!input) {
        this.rl.prompt();
        return;
      }
      
      // Handle special commands
      if (input.startsWith('/')) {
        await this.handleCommand(input);
      } else {
        await this.askQuestion(input);
      }
      
      this.rl.prompt();
    });
    
    this.rl.on('close', () => {
      console.log(`\n${COLORS.yellow}Goodbye! 👋${COLORS.reset}`);
      process.exit(0);
    });
  }

  private async displayBanner() {
    console.log(`
${COLORS.cyan}╔════════════════════════════════════════════════════════╗
║                                                        ║
║     ${COLORS.bright}🌱 Quartz Expert Agent CLI${COLORS.reset}${COLORS.cyan}                        ║
║                                                        ║
║     Your AI assistant for Quartz static site generator ║
║                                                        ║
╚════════════════════════════════════════════════════════╝${COLORS.reset}

${COLORS.yellow}Commands:${COLORS.reset}
  ${COLORS.bright}/help${COLORS.reset}      - Show this help message
  ${COLORS.bright}/clear${COLORS.reset}     - Clear the screen
  ${COLORS.bright}/history${COLORS.reset}   - Show conversation history
  ${COLORS.bright}/metrics${COLORS.reset}   - Display agent metrics
  ${COLORS.bright}/search${COLORS.reset}    - Search knowledge base
  ${COLORS.bright}/validate${COLORS.reset}  - Run validation tests
  ${COLORS.bright}/refresh${COLORS.reset}   - Refresh knowledge base
  ${COLORS.bright}/exit${COLORS.reset}      - Exit the CLI

${COLORS.green}Type your questions about Quartz or use commands above.${COLORS.reset}
`);
  }

  private async checkAgentHealth(): Promise<void> {
    try {
      const response = await fetch(`${AGENT_URL}/api/health`);
      const data = await response.json();
      
      if (data.status === 'healthy') {
        console.log(`${COLORS.green}✓ Agent is online and ready${COLORS.reset}\n`);
      } else {
        throw new Error('Agent unhealthy');
      }
    } catch (error) {
      console.log(`${COLORS.red}✗ Agent is not running!${COLORS.reset}`);
      console.log(`${COLORS.yellow}Please start the agent with: npm start${COLORS.reset}\n`);
      process.exit(1);
    }
  }

  private async handleCommand(command: string): Promise<void> {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
      case '/help':
        await this.displayBanner();
        break;
        
      case '/clear':
        console.clear();
        break;
        
      case '/history':
        this.showHistory();
        break;
        
      case '/metrics':
        await this.showMetrics();
        break;
        
      case '/search':
        await this.searchKnowledge();
        break;
        
      case '/validate':
        await this.runValidation();
        break;
        
      case '/refresh':
        await this.refreshKnowledge();
        break;
        
      case '/exit':
      case '/quit':
        this.rl.close();
        break;
        
      default:
        console.log(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
        console.log(`Type ${COLORS.bright}/help${COLORS.reset} for available commands`);
    }
  }

  private async askQuestion(question: string): Promise<void> {
    console.log(`${COLORS.blue}Thinking...${COLORS.reset}`);
    
    try {
      const response = await fetch(`${AGENT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          sessionId: this.sessionId,
          history: this.history.slice(-5) // Keep last 5 exchanges for context
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.response) {
        // Clear "Thinking..." line
        process.stdout.write('\x1b[1A\x1b[2K');
        
        console.log(`\n${COLORS.cyan}Answer:${COLORS.reset}`);
        this.formatOutput(data.response);
        
        if (data.sources && data.sources.length > 0) {
          console.log(`\n${COLORS.magenta}Sources:${COLORS.reset}`);
          data.sources.forEach((source: string) => {
            console.log(`  • ${source}`);
          });
        }
        
        if (data.suggestions && data.suggestions.length > 0) {
          console.log(`\n${COLORS.yellow}You might also ask:${COLORS.reset}`);
          data.suggestions.forEach((suggestion: string) => {
            console.log(`  • ${suggestion}`);
          });
        }
        
        // Add to history
        this.history.push(
          { role: 'user', content: question },
          { role: 'assistant', content: data.response }
        );
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      process.stdout.write('\x1b[1A\x1b[2K'); // Clear "Thinking..." line
      console.log(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
    }
    
    console.log(); // Empty line for spacing
  }

  private formatOutput(text: string): void {
    // Format code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let formatted = text;
    
    formatted = formatted.replace(codeBlockRegex, (match, lang, code) => {
      return `\n${COLORS.bright}${lang || 'code'}:${COLORS.reset}\n${COLORS.green}${code}${COLORS.reset}`;
    });
    
    // Format inline code
    formatted = formatted.replace(/`([^`]+)`/g, `${COLORS.bright}$1${COLORS.reset}`);
    
    // Format bold text
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, `${COLORS.bright}$1${COLORS.reset}`);
    
    // Wrap text to terminal width
    const terminalWidth = process.stdout.columns || 80;
    const lines = formatted.split('\n');
    
    lines.forEach(line => {
      if (line.length > terminalWidth) {
        const words = line.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
          if ((currentLine + word).length > terminalWidth) {
            console.log(currentLine.trim());
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });
        
        if (currentLine.trim()) {
          console.log(currentLine.trim());
        }
      } else {
        console.log(line);
      }
    });
  }

  private showHistory(): void {
    if (this.history.length === 0) {
      console.log(`${COLORS.yellow}No conversation history yet${COLORS.reset}`);
      return;
    }
    
    console.log(`\n${COLORS.cyan}Conversation History:${COLORS.reset}`);
    console.log('─'.repeat(50));
    
    this.history.forEach((entry, i) => {
      if (entry.role === 'user') {
        console.log(`\n${COLORS.green}You:${COLORS.reset} ${entry.content}`);
      } else {
        console.log(`${COLORS.blue}Agent:${COLORS.reset} ${entry.content.substring(0, 100)}...`);
      }
    });
    
    console.log('─'.repeat(50));
  }

  private async showMetrics(): Promise<void> {
    try {
      const response = await fetch(`${AGENT_URL}/api/metrics`);
      const data = await response.json();
      
      console.log(`\n${COLORS.cyan}Agent Metrics:${COLORS.reset}`);
      console.log('─'.repeat(50));
      
      if (data.report) {
        console.log(data.report);
      } else {
        console.log(JSON.stringify(data.metrics, null, 2));
      }
      
      console.log('─'.repeat(50));
    } catch (error) {
      console.log(`${COLORS.red}Failed to fetch metrics${COLORS.reset}`);
    }
  }

  private async searchKnowledge(): Promise<void> {
    const query = await this.prompt('Search query: ');
    
    if (!query) return;
    
    try {
      const response = await fetch(`${AGENT_URL}/api/knowledge/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 3 })
      });
      
      const data = await response.json();
      
      console.log(`\n${COLORS.cyan}Search Results:${COLORS.reset}`);
      console.log('─'.repeat(50));
      
      data.results.forEach((result: any, i: number) => {
        console.log(`\n${COLORS.bright}${i + 1}. ${result.metadata.source}${COLORS.reset}`);
        console.log(`Relevance: ${(result.relevanceScore * 100).toFixed(1)}%`);
        console.log(result.content.substring(0, 200) + '...');
      });
      
      console.log('─'.repeat(50));
    } catch (error) {
      console.log(`${COLORS.red}Search failed${COLORS.reset}`);
    }
  }

  private async runValidation(): Promise<void> {
    console.log(`\n${COLORS.yellow}Running validation tests...${COLORS.reset}`);
    
    try {
      // Run CogniCap test
      console.log('Testing cognitive capacity...');
      const cogniResponse = await fetch(`${AGENT_URL}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType: 'cognicap',
          testData: {
            tokensUsed: 1000,
            maxTokens: 8000,
            responseTime: 1500,
            contextWindowUsage: 0.6
          }
        })
      });
      
      const cogniResult = await cogniResponse.json();
      
      console.log(`\n${COLORS.cyan}Validation Results:${COLORS.reset}`);
      console.log('─'.repeat(50));
      console.log(`CogniCap: ${cogniResult.passed ? '✅' : '❌'} ${cogniResult.score}%`);
      console.log(cogniResult.details);
      console.log('─'.repeat(50));
    } catch (error) {
      console.log(`${COLORS.red}Validation failed${COLORS.reset}`);
    }
  }

  private async refreshKnowledge(): Promise<void> {
    console.log(`\n${COLORS.yellow}Refreshing knowledge base...${COLORS.reset}`);
    
    try {
      const response = await fetch(`${AGENT_URL}/api/knowledge/refresh`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`${COLORS.green}✓ Knowledge base refreshed${COLORS.reset}`);
        console.log(`Documents processed: ${data.documentsProcessed}`);
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      console.log(`${COLORS.red}Failed to refresh knowledge base${COLORS.reset}`);
    }
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(`${COLORS.cyan}${question}${COLORS.reset}`, (answer) => {
        resolve(answer);
      });
    });
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new QuartzExpertCLI();
  cli.start().catch(console.error);
}

export { QuartzExpertCLI };