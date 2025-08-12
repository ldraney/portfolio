/**
 * Universal Protocol Implementation
 * Standard interface for agent communication and validation
 */

export interface ValidationResult {
  passed: boolean;
  score: number;
  details: string;
}

export class UniversalProtocol {
  /**
   * Validate CogniCap test - Cognitive load management
   */
  async validateCogniCap(testData: any): Promise<ValidationResult> {
    const tests = {
      tokenUsage: false,
      responseTime: false,
      contextManagement: false
    };

    // Test 1: Token usage efficiency
    if (testData.tokensUsed && testData.maxTokens) {
      tests.tokenUsage = (testData.tokensUsed / testData.maxTokens) < 0.8;
    }

    // Test 2: Response time
    if (testData.responseTime) {
      tests.responseTime = testData.responseTime < 2000; // Under 2 seconds
    }

    // Test 3: Context window management
    if (testData.contextWindowUsage) {
      tests.contextManagement = testData.contextWindowUsage < 0.75;
    }

    const passed = Object.values(tests).filter(t => t).length;
    const total = Object.keys(tests).length;
    const score = (passed / total) * 100;

    return {
      passed: score >= 70,
      score,
      details: `Passed ${passed}/${total} CogniCap tests`
    };
  }

  /**
   * Validate Theoretical test - Domain knowledge
   */
  async validateTheoretical(testData: any, ragSystem: any): Promise<ValidationResult> {
    const questions = testData.questions || [
      {
        question: "How do you create a custom plugin in Quartz?",
        expectedKeywords: ["transformer", "emitter", "filter", "plugin", "export"]
      },
      {
        question: "What is the purpose of quartz.config.ts?",
        expectedKeywords: ["configuration", "plugins", "theme", "baseUrl", "pageTitle"]
      },
      {
        question: "How does Quartz handle Obsidian-style wikilinks?",
        expectedKeywords: ["[[", "ObsidianFlavoredMarkdown", "wikilinks", "internal links"]
      },
      {
        question: "What deployment options are available for Quartz?",
        expectedKeywords: ["GitHub Pages", "Netlify", "Vercel", "static", "hosting"]
      }
    ];

    let correctAnswers = 0;

    for (const q of questions) {
      const result = await ragSystem.answer(q.question);
      
      // Check if answer contains expected keywords
      const answerLower = result.answer.toLowerCase();
      const keywordsFound = q.expectedKeywords.filter(
        keyword => answerLower.includes(keyword.toLowerCase())
      );

      if (keywordsFound.length >= Math.ceil(q.expectedKeywords.length * 0.6)) {
        correctAnswers++;
      }
    }

    const score = (correctAnswers / questions.length) * 100;

    return {
      passed: score >= 80,
      score,
      details: `Answered ${correctAnswers}/${questions.length} theoretical questions correctly`
    };
  }

  /**
   * Validate Implementation test - Practical execution
   */
  async validateImplementation(testData: any, ragSystem: any): Promise<ValidationResult> {
    const tasks = testData.tasks || [
      {
        task: "Generate a quartz.config.ts for a blog",
        validate: (response: string) => response.includes('QuartzConfig') && response.includes('plugins')
      },
      {
        task: "Create a custom component",
        validate: (response: string) => response.includes('QuartzComponent') && response.includes('export')
      },
      {
        task: "Explain deployment to GitHub Pages",
        validate: (response: string) => response.includes('gh-pages') || response.includes('deploy')
      },
      {
        task: "Debug a plugin conflict",
        validate: (response: string) => response.includes('transformer') || response.includes('order')
      }
    ];

    let completedTasks = 0;

    for (const task of tasks) {
      const result = await ragSystem.answer(task.task);
      
      if (task.validate(result.answer)) {
        completedTasks++;
      }
    }

    const score = (completedTasks / tasks.length) * 100;

    return {
      passed: score >= 75,
      score,
      details: `Completed ${completedTasks}/${tasks.length} implementation tasks`
    };
  }

  /**
   * Standard health check
   */
  async healthCheck(serviceUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${serviceUrl}/api/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Get agent identity
   */
  async getIdentity(serviceUrl: string): Promise<any> {
    try {
      const response = await fetch(`${serviceUrl}/api/identity`);
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Inter-agent communication
   */
  async sendMessage(targetAgent: string, message: any): Promise<any> {
    const agentPorts: Record<string, number> = {
      'quartz-expert': 3095,
      'agent-trainer': 3030,
      'cognicap': 3025,
      // Add more agents as needed
    };

    const port = agentPorts[targetAgent];
    if (!port) {
      throw new Error(`Unknown agent: ${targetAgent}`);
    }

    try {
      const response = await fetch(`http://localhost:${port}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.content,
          sessionId: message.sessionId,
          fromAgent: 'quartz-expert'
        })
      });

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to communicate with ${targetAgent}: ${error.message}`);
    }
  }
}