#!/usr/bin/env tsx
/**
 * Three-Test Validation for Quartz Expert Agent
 * Implements CogniCap, Theoretical, and Implementation tests
 */

import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

config();

interface TestResult {
  testName: string;
  passed: boolean;
  score: number;
  details: string;
  timestamp: string;
}

interface CertificationResult {
  agentName: string;
  certified: boolean;
  scores: {
    cognicap: number;
    theoretical: number;
    implementation: number;
    overall: number;
  };
  tests: TestResult[];
  recommendations?: string[];
  timestamp: string;
}

class QuartzExpertValidator {
  private agentUrl: string;
  private agentName: string = 'quartz-expert';
  private results: TestResult[] = [];

  constructor() {
    this.agentUrl = `http://localhost:${process.env.PORT || 3095}`;
  }

  /**
   * Run CogniCap Test - Cognitive Load Management
   */
  async runCogniCapTest(): Promise<TestResult> {
    console.log('🧠 Running CogniCap Test...');
    
    const testQueries = [
      "How do I create a custom transformer plugin in Quartz?",
      "Explain the complete build pipeline with all stages",
      "What are all the configuration options for syntax highlighting?",
      "How do I migrate from Obsidian to Quartz with all my plugins?",
      "Describe the component architecture and lifecycle"
    ];

    let totalTokens = 0;
    let totalTime = 0;
    let successfulResponses = 0;
    const maxResponseTime = 2000; // 2 seconds

    for (const query of testQueries) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${this.agentUrl}/api/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: query })
        });

        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        totalTime += responseTime;
        
        if (response.ok && data.answer) {
          successfulResponses++;
          // Estimate tokens (rough approximation)
          totalTokens += data.answer.length / 4;
        }
      } catch (error) {
        console.error(`Error testing query: ${query}`, error);
      }
    }

    const avgResponseTime = totalTime / testQueries.length;
    const tokenEfficiency = totalTokens < 8000 ? 100 : (8000 / totalTokens) * 100;
    const timeScore = avgResponseTime < maxResponseTime ? 100 : (maxResponseTime / avgResponseTime) * 100;
    const successRate = (successfulResponses / testQueries.length) * 100;

    const cogniCapScore = Math.round((tokenEfficiency + timeScore + successRate) / 3);

    const result: TestResult = {
      testName: 'CogniCap',
      passed: cogniCapScore >= 70,
      score: cogniCapScore,
      details: `Token Efficiency: ${tokenEfficiency.toFixed(1)}%, Response Time: ${avgResponseTime.toFixed(0)}ms, Success Rate: ${successRate.toFixed(1)}%`,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);
    console.log(`   ✓ CogniCap Score: ${cogniCapScore}%\n`);
    
    return result;
  }

  /**
   * Run Theoretical Test - Domain Knowledge
   */
  async runTheoreticalTest(): Promise<TestResult> {
    console.log('📚 Running Theoretical Test...');
    
    const questions = [
      {
        question: "What is the purpose of QuartzTransformerPlugin?",
        keywords: ["transform", "ast", "content", "markdown", "process"]
      },
      {
        question: "How does the ContentIndex emitter work?",
        keywords: ["search", "index", "flexsearch", "json", "static"]
      },
      {
        question: "Explain Quartz's plugin architecture",
        keywords: ["transformer", "emitter", "filter", "pipeline", "plugin"]
      },
      {
        question: "What are the deployment options for Quartz?",
        keywords: ["github pages", "netlify", "vercel", "static", "hosting"]
      },
      {
        question: "How to handle Obsidian-style wikilinks?",
        keywords: ["[[", "obsidian", "wikilink", "internal", "link"]
      },
      {
        question: "Describe the theme customization process",
        keywords: ["css", "scss", "colors", "typography", "layout"]
      }
    ];

    let correctAnswers = 0;

    for (const q of questions) {
      try {
        const response = await fetch(`${this.agentUrl}/api/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q.question })
        });

        const data = await response.json();
        
        if (response.ok && data.answer) {
          const answerLower = data.answer.toLowerCase();
          const keywordsFound = q.keywords.filter(k => 
            answerLower.includes(k.toLowerCase())
          );
          
          // Pass if at least 60% of keywords are found
          if (keywordsFound.length >= Math.ceil(q.keywords.length * 0.6)) {
            correctAnswers++;
          }
        }
      } catch (error) {
        console.error(`Error testing question: ${q.question}`, error);
      }
    }

    const theoreticalScore = Math.round((correctAnswers / questions.length) * 100);

    const result: TestResult = {
      testName: 'Theoretical',
      passed: theoreticalScore >= 80,
      score: theoreticalScore,
      details: `Answered ${correctAnswers}/${questions.length} questions correctly`,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);
    console.log(`   ✓ Theoretical Score: ${theoreticalScore}%\n`);
    
    return result;
  }

  /**
   * Run Implementation Test - Practical Execution
   */
  async runImplementationTest(): Promise<TestResult> {
    console.log('🔨 Running Implementation Test...');
    
    const tasks = [
      {
        task: "Generate a complete quartz.config.ts for a technical blog with syntax highlighting and math support",
        validation: (response: string) => {
          return response.includes('QuartzConfig') &&
                 response.includes('SyntaxHighlighting') &&
                 response.includes('Latex') &&
                 response.includes('plugins');
        }
      },
      {
        task: "Create a custom QuartzComponent for displaying reading time",
        validation: (response: string) => {
          return response.includes('QuartzComponent') &&
                 response.includes('export') &&
                 response.includes('reading') &&
                 (response.includes('props') || response.includes('displayClass'));
        }
      },
      {
        task: "Write a GitHub Actions workflow for deploying Quartz",
        validation: (response: string) => {
          return response.includes('workflow') &&
                 response.includes('deploy') &&
                 (response.includes('gh-pages') || response.includes('pages'));
        }
      },
      {
        task: "Create a custom transformer to add anchor links to headings",
        validation: (response: string) => {
          return response.includes('transformer') &&
                 response.includes('visit') &&
                 response.includes('heading');
        }
      },
      {
        task: "Configure Quartz for multi-language support",
        validation: (response: string) => {
          return response.includes('locale') ||
                 response.includes('i18n') ||
                 response.includes('language');
        }
      }
    ];

    let completedTasks = 0;

    for (const task of tasks) {
      try {
        const response = await fetch(`${this.agentUrl}/api/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: task.task })
        });

        const data = await response.json();
        
        if (response.ok && data.answer && task.validation(data.answer)) {
          completedTasks++;
        }
      } catch (error) {
        console.error(`Error testing task: ${task.task}`, error);
      }
    }

    const implementationScore = Math.round((completedTasks / tasks.length) * 100);

    const result: TestResult = {
      testName: 'Implementation',
      passed: implementationScore >= 75,
      score: implementationScore,
      details: `Completed ${completedTasks}/${tasks.length} implementation tasks`,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);
    console.log(`   ✓ Implementation Score: ${implementationScore}%\n`);
    
    return result;
  }

  /**
   * Check if agent is running
   */
  async checkAgentHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.agentUrl}/api/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Run full certification process
   */
  async certify(): Promise<CertificationResult> {
    console.log('🎓 Starting Quartz Expert Agent Certification\n');
    console.log('=' .repeat(50) + '\n');

    // Check if agent is running
    const isHealthy = await this.checkAgentHealth();
    if (!isHealthy) {
      console.error('❌ Agent is not running! Please start the agent first.');
      console.log('Run: npm start');
      process.exit(1);
    }

    // Run all tests
    const cogniCapResult = await this.runCogniCapTest();
    const theoreticalResult = await this.runTheoreticalTest();
    const implementationResult = await this.runImplementationTest();

    // Calculate overall score
    const overallScore = Math.round(
      (cogniCapResult.score + theoreticalResult.score + implementationResult.score) / 3
    );

    // Determine certification status
    const certified = 
      cogniCapResult.passed &&
      theoreticalResult.passed &&
      implementationResult.passed &&
      overallScore >= 75;

    const certification: CertificationResult = {
      agentName: this.agentName,
      certified,
      scores: {
        cognicap: cogniCapResult.score,
        theoretical: theoreticalResult.score,
        implementation: implementationResult.score,
        overall: overallScore
      },
      tests: this.results,
      timestamp: new Date().toISOString()
    };

    // Add recommendations if not certified
    if (!certified) {
      certification.recommendations = [];
      
      if (!cogniCapResult.passed) {
        certification.recommendations.push('Optimize response time and token usage');
      }
      if (!theoreticalResult.passed) {
        certification.recommendations.push('Improve knowledge base coverage');
      }
      if (!implementationResult.passed) {
        certification.recommendations.push('Enhance practical code generation capabilities');
      }
    }

    // Display results
    console.log('📊 Certification Results:');
    console.log('=' .repeat(50));
    console.log(`   CogniCap:       ${cogniCapResult.score}% (Required: 70%)`);
    console.log(`   Theoretical:    ${theoreticalResult.score}% (Required: 80%)`);
    console.log(`   Implementation: ${implementationResult.score}% (Required: 75%)`);
    console.log(`   Overall:        ${overallScore}% (Required: 75%)\n`);

    if (certified) {
      console.log('✅ CERTIFICATION PASSED!');
      console.log('🎉 Quartz Expert Agent is certified and ready for deployment!\n');
      
      // Save certification
      await this.saveCertification(certification);
      
      // Register with agent-trainer
      await this.registerWithTrainer(certification);
    } else {
      console.log('❌ CERTIFICATION FAILED');
      console.log('📝 Recommendations:');
      certification.recommendations?.forEach(rec => {
        console.log(`   - ${rec}`);
      });
      console.log('\nAgent needs additional training in weak areas\n');
    }

    return certification;
  }

  /**
   * Save certification to file
   */
  private async saveCertification(cert: CertificationResult): Promise<void> {
    const certPath = path.join(__dirname, '../../certifications');
    await fs.mkdir(certPath, { recursive: true });
    
    const filename = `${this.agentName}-${Date.now()}.json`;
    await fs.writeFile(
      path.join(certPath, filename),
      JSON.stringify(cert, null, 2)
    );
    
    console.log(`📁 Certification saved to: certifications/${filename}\n`);
  }

  /**
   * Register certification with agent-trainer
   */
  private async registerWithTrainer(cert: CertificationResult): Promise<void> {
    try {
      const trainerUrl = process.env.AGENT_TRAINER_URL || 'http://localhost:3030';
      
      const response = await fetch(`${trainerUrl}/api/certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cert)
      });

      if (response.ok) {
        console.log('📋 Registered with Agent Trainer successfully\n');
      }
    } catch (error) {
      console.log('ℹ️  Agent Trainer not available, certification saved locally\n');
    }
  }
}

// Run certification if called directly
import { fileURLToPath } from 'url';

if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new QuartzExpertValidator();
  
  validator.certify()
    .then((result) => {
      process.exit(result.certified ? 0 : 1);
    })
    .catch((error) => {
      console.error('Certification failed:', error);
      process.exit(1);
    });
}

export { QuartzExpertValidator, TestResult, CertificationResult };