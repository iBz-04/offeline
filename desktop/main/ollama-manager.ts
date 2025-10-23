import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import { EventEmitter } from 'events';

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

export class OllamaManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private readonly apiUrl = 'http://localhost:11434';
  private healthCheckInterval: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (await this.isRunning()) {
      console.log('Ollama is already running');
      return;
    }

    this.process = spawn('ollama', ['serve'], {
      detached: false,
      stdio: 'pipe',
    });

    this.process.on('error', (error) => {
      this.emit('error', `Failed to start Ollama: ${error.message}`);
    });

    await this.waitForReady();
    this.startHealthCheck();
  }

  async stop(): Promise<void> {
    this.stopHealthCheck();
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  async isRunning(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/api/tags`, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  private async waitForReady(maxAttempts = 30, delayMs = 500): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isRunning()) {
        this.emit('ready');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    throw new Error('Ollama failed to start within timeout period');
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      const running = await this.isRunning();
      this.emit('health', running);
      if (!running && this.process) {
        this.emit('error', 'Ollama server stopped unexpectedly');
      }
    }, 10000);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      throw new Error(`Failed to list models: ${error}`);
    }
  }

  async pullModel(modelName: string): Promise<void> {
    const response = await axios.post(
      `${this.apiUrl}/api/pull`,
      { name: modelName },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        lines.forEach(line => {
          if (!line.trim()) return;
          try {
            const data = JSON.parse(line);
            if (data.status) {
              const completed = data.completed || 0;
              const total = data.total || 0;
              
              if (total > 0 || data.status === 'success' || data.status.includes('pulling')) {
                this.emit('pullProgress', {
                  model: modelName,
                  status: data.status,
                  completed,
                  total: total > 0 ? total : completed, 
                });
              }
            }
            if (data.status === 'success') {
              resolve();
            }
          } catch (e) {
            console.error('Failed to parse pull progress:', e);
          }
        });
      });

      response.data.on('error', reject);
      response.data.on('end', () => {
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer);
            if (data.status === 'success') {
              resolve();
            }
          } catch (e) {
            console.error('Failed to parse final pull status:', e);
          }
        }
        resolve();
      });
    });
  }

  async deleteModel(modelName: string): Promise<void> {
    await axios.delete(`${this.apiUrl}/api/delete`, {
      data: { name: modelName },
    });
  }

  async chat(
    model: string,
    messages: ChatMessage[],
    stream = true
  ): Promise<string> {
    const response = await axios.post(
      `${this.apiUrl}/api/chat`,
      { model, messages, stream },
      { responseType: stream ? 'stream' : 'json' }
    );

    if (!stream) {
      return response.data.message.content;
    }

    return new Promise((resolve, reject) => {
      let fullResponse = '';
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        lines.forEach(line => {
          if (!line.trim()) return;
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullResponse += data.message.content;
              this.emit('chatToken', data.message.content);
            }
            if (data.done) {
              resolve(fullResponse);
            }
          } catch (e) {
            console.error('Failed to parse chat response:', e);
          }
        });
      });

      response.data.on('error', reject);
      response.data.on('end', () => {
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer);
            if (data.done) {
              resolve(fullResponse);
            }
          } catch (e) {
            console.error('Failed to parse final chat response:', e);
          }
        }
        resolve(fullResponse);
      });
    });
  }

  async showModelInfo(modelName: string): Promise<any> {
    const response = await axios.post(`${this.apiUrl}/api/show`, {
      name: modelName,
    });
    return response.data;
  }
}
