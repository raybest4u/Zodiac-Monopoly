/**
 * LLM服务配置管理系统
 * LLM Service Configuration Management System
 * 
 * 提供统一的AI服务配置管理，支持多种LLM提供商
 * Provides unified AI service configuration management with support for multiple LLM providers
 */

export type LLMProvider = 'deepseek' | 'openai' | 'claude';

export interface LLMProviderConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  maxTokens: number;
  temperature?: number;
}

export interface LLMConfiguration {
  defaultProvider: LLMProvider;
  providers: {
    deepseek: LLMProviderConfig;
    openai: LLMProviderConfig;
    claude: LLMProviderConfig;
  };
  // 通用配置
  common: {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    enableLogging: boolean;
    enableMetrics: boolean;
  };
}

/**
 * LLM配置管理器类
 */
export class LLMConfigManager {
  private static instance: LLMConfigManager;
  private config: LLMConfiguration;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * 获取配置管理器单例
   */
  public static getInstance(): LLMConfigManager {
    if (!LLMConfigManager.instance) {
      LLMConfigManager.instance = new LLMConfigManager();
    }
    return LLMConfigManager.instance;
  }

  /**
   * 加载配置
   */
  private loadConfiguration(): LLMConfiguration {
    return {
      defaultProvider: (import.meta.env.VITE_DEFAULT_LLM_PROVIDER as LLMProvider) || 'deepseek',
      
      providers: {
        deepseek: {
          apiKey: this.getRequiredEnvVar('DEEPSEEK_API_KEY'),
          apiUrl: this.getStringEnvVar('DEEPSEEK_API_URL', 'https://api.deepseek.com/chat/completions'),
          model: this.getStringEnvVar('DEEPSEEK_MODEL', 'deepseek-chat'),
          maxTokens: this.getNumericEnvVar('DEEPSEEK_MAX_TOKENS', 2000),
          temperature: this.getNumericEnvVar('DEEPSEEK_TEMPERATURE', 0.7)
        },
        
        openai: {
          apiKey: this.getStringEnvVar('OPENAI_API_KEY', ''),
          apiUrl: this.getStringEnvVar('OPENAI_API_URL', 'https://api.openai.com/v1/chat/completions'),
          model: this.getStringEnvVar('OPENAI_MODEL', 'gpt-3.5-turbo'),
          maxTokens: this.getNumericEnvVar('OPENAI_MAX_TOKENS', 2000),
          temperature: this.getNumericEnvVar('OPENAI_TEMPERATURE', 0.7)
        },
        
        claude: {
          apiKey: this.getStringEnvVar('CLAUDE_API_KEY', ''),
          apiUrl: this.getStringEnvVar('CLAUDE_API_URL', 'https://api.anthropic.com/v1/messages'),
          model: this.getStringEnvVar('CLAUDE_MODEL', 'claude-3-sonnet-20240229'),
          maxTokens: this.getNumericEnvVar('CLAUDE_MAX_TOKENS', 2000),
          temperature: this.getNumericEnvVar('CLAUDE_TEMPERATURE', 0.7)
        }
      },

      common: {
        timeout: this.getNumericEnvVar('LLM_TIMEOUT', 30000),
        retryAttempts: this.getNumericEnvVar('LLM_RETRY_ATTEMPTS', 3),
        retryDelay: this.getNumericEnvVar('LLM_RETRY_DELAY', 1000),
        enableLogging: this.getBooleanEnvVar('LLM_ENABLE_LOGGING', true),
        enableMetrics: this.getBooleanEnvVar('LLM_ENABLE_METRICS', true)
      }
    };
  }

  /**
   * 获取必需的环境变量，如果未设置则抛出错误
   */
  private getRequiredEnvVar(key: string): string {
    const value = import.meta.env[`VITE_${key}`];
    if (!value || value.trim() === '') {
      throw new Error(`Required environment variable VITE_${key} is not set or empty`);
    }
    return value.trim();
  }

  /**
   * 获取数值类型环境变量
   */
  private getNumericEnvVar(key: string, defaultValue: number): number {
    const value = import.meta.env[`VITE_${key}`];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * 获取布尔类型环境变量
   */
  private getBooleanEnvVar(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env[`VITE_${key}`];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * 获取字符串类型环境变量
   */
  private getStringEnvVar(key: string, defaultValue: string): string {
    return import.meta.env[`VITE_${key}`] || defaultValue;
  }

  /**
   * 获取完整配置
   */
  public getConfig(): LLMConfiguration {
    return this.config;
  }

  /**
   * 获取默认提供商配置
   */
  public getDefaultProviderConfig(): LLMProviderConfig {
    return this.config.providers[this.config.defaultProvider];
  }

  /**
   * 获取指定提供商配置
   */
  public getProviderConfig(provider: LLMProvider): LLMProviderConfig {
    const config = this.config.providers[provider];
    if (!config.apiKey && provider === this.config.defaultProvider) {
      throw new Error(`API key for default provider ${provider} is required but not configured`);
    }
    return config;
  }

  /**
   * 获取通用配置
   */
  public getCommonConfig() {
    return this.config.common;
  }

  /**
   * 获取默认提供商
   */
  public getDefaultProvider(): LLMProvider {
    return this.config.defaultProvider;
  }

  /**
   * 检查提供商是否可用
   */
  public isProviderAvailable(provider: LLMProvider): boolean {
    try {
      const config = this.getProviderConfig(provider);
      return config.apiKey !== '';
    } catch {
      return false;
    }
  }

  /**
   * 获取可用的提供商列表
   */
  public getAvailableProviders(): LLMProvider[] {
    return (['deepseek', 'openai', 'claude'] as LLMProvider[])
      .filter(provider => this.isProviderAvailable(provider));
  }

  /**
   * 重新加载配置
   */
  public reloadConfig(): void {
    this.config = this.loadConfiguration();
  }

  /**
   * 验证配置
   */
  public validateConfig(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证默认提供商
    if (!this.config.providers[this.config.defaultProvider]) {
      errors.push(`Default provider ${this.config.defaultProvider} is not configured`);
    }

    // 验证每个提供商配置
    for (const [providerName, config] of Object.entries(this.config.providers)) {
      const provider = providerName as LLMProvider;
      
      if (provider === this.config.defaultProvider && !config.apiKey) {
        errors.push(`API key for default provider ${provider} is required`);
      }
      
      if (!config.apiKey) {
        warnings.push(`API key for provider ${provider} is not set`);
      }
      
      if (config.maxTokens <= 0) {
        errors.push(`Max tokens for provider ${provider} must be positive`);
      }
      
      if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
        warnings.push(`Temperature for provider ${provider} should be between 0 and 2`);
      }
    }

    // 验证通用配置
    if (this.config.common.timeout <= 0) {
      errors.push('Timeout must be positive');
    }
    
    if (this.config.common.retryAttempts < 0) {
      errors.push('Retry attempts must be non-negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取配置摘要
   */
  public getConfigSummary(): object {
    const availableProviders = this.getAvailableProviders();
    return {
      defaultProvider: this.config.defaultProvider,
      availableProviders,
      providersCount: availableProviders.length,
      defaultConfig: {
        model: this.getDefaultProviderConfig().model,
        maxTokens: this.getDefaultProviderConfig().maxTokens,
        temperature: this.getDefaultProviderConfig().temperature
      },
      common: {
        timeout: `${this.config.common.timeout}ms`,
        retryAttempts: this.config.common.retryAttempts,
        loggingEnabled: this.config.common.enableLogging,
        metricsEnabled: this.config.common.enableMetrics
      }
    };
  }

  /**
   * 获取用于LLMService的配置对象
   */
  public getLLMServiceConfig(provider?: LLMProvider): {
    apiKey: string;
    apiUrl: string;
    model: string;
    maxTokens: number;
    temperature?: number;
  } {
    const targetProvider = provider || this.config.defaultProvider;
    const providerConfig = this.getProviderConfig(targetProvider);
    
    return {
      apiKey: providerConfig.apiKey,
      apiUrl: providerConfig.apiUrl,
      model: providerConfig.model,
      maxTokens: providerConfig.maxTokens,
      temperature: providerConfig.temperature
    };
  }
}

// 默认导出配置管理器实例
export const llmConfig = LLMConfigManager.getInstance();
export default llmConfig;