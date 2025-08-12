/**
 * CogniCap Integration for Quartz Expert Agent
 * Monitors cognitive load and semantic consistency
 */

export interface CognitiveMetrics {
  agentId: string;
  timestamp: number;
  contextWindowUsage: number;
  processingLatency: number;
  errorRate: number;
  semanticConsistency: number;
  cognitiveLoadIndex: number;
}

export class CogniCapMonitor {
  private agentId: string;
  private metrics: CognitiveMetrics[] = [];
  private cogniCapUrl: string;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.cogniCapUrl = process.env.COGNICAP_URL || 'http://localhost:3025';
  }

  async recordMetric(metric: CognitiveMetrics): Promise<void> {
    // Store locally
    this.metrics.push(metric);
    if (this.metrics.length > 1000) {
      this.metrics.shift(); // Keep only last 1000 metrics
    }

    // Send to CogniCap service if available
    try {
      await fetch(`${this.cogniCapUrl}/api/measure/${this.agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric })
      });
    } catch (error) {
      // CogniCap service might not be running, continue locally
      console.log('CogniCap service not available, storing metrics locally');
    }

    // Calculate cognitive load
    metric.cognitiveLoadIndex = this.calculateCognitiveLoad(metric);
  }

  private calculateCognitiveLoad(metric: CognitiveMetrics): number {
    const weights = {
      context: 0.25,
      latency: 0.25,
      error: 0.30,
      drift: 0.20
    };

    const contextLoad = metric.contextWindowUsage;
    const latencyLoad = Math.min(metric.processingLatency / 3000, 1); // Normalize to 3s max
    const errorLoad = metric.errorRate;
    const driftLoad = 1 - metric.semanticConsistency;

    return (
      contextLoad * weights.context +
      latencyLoad * weights.latency +
      errorLoad * weights.error +
      driftLoad * weights.drift
    );
  }

  async getMetrics(agentId: string): Promise<any> {
    const recent = this.metrics.slice(-10);
    
    if (recent.length === 0) {
      return {
        cognitiveLoadIndex: 0,
        averageLatency: 0,
        semanticConsistency: 1,
        errorRate: 0
      };
    }

    return {
      cognitiveLoadIndex: recent.reduce((sum, m) => sum + m.cognitiveLoadIndex, 0) / recent.length,
      averageLatency: recent.reduce((sum, m) => sum + m.processingLatency, 0) / recent.length,
      semanticConsistency: recent.reduce((sum, m) => sum + m.semanticConsistency, 0) / recent.length,
      errorRate: recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length
    };
  }

  async generateReport(agentId: string): Promise<string> {
    const metrics = await this.getMetrics(agentId);
    
    return `
Cognitive Load Report for ${agentId}
=====================================

Overall Cognitive Load Index: ${(metrics.cognitiveLoadIndex * 100).toFixed(1)}%
Average Processing Latency: ${metrics.averageLatency.toFixed(0)}ms
Semantic Consistency: ${(metrics.semanticConsistency * 100).toFixed(1)}%
Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%

Status: ${metrics.cognitiveLoadIndex < 0.7 ? '✅ Optimal' : '⚠️ Degraded'}
${metrics.cognitiveLoadIndex > 0.7 ? '\nRecommendation: Consider knowledge base optimization or context window reduction' : ''}
    `.trim();
  }
}