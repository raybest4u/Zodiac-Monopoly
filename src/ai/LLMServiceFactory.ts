/**
 * LLM服务工厂类 - 提供统一的LLM服务创建接口
 */

import { LLMService, LLMConfig } from './LLMService';
import { llmConfig, LLMProvider } from '../config/LLMConfig';

/**
 * LLM服务工厂
 */
export class LLMServiceFactory {
  private static instances: Map<LLMProvider, LLMService> = new Map();

  /**
   * 创建默认LLM服务实例
   */
  static createDefault(): LLMService {
    const provider = llmConfig.getDefaultProvider();
    return this.create(provider);
  }

  /**
   * 创建指定提供商的LLM服务实例
   */
  static create(provider: LLMProvider): LLMService {
    // 检查是否已有缓存实例
    if (this.instances.has(provider)) {
      return this.instances.get(provider)!;
    }

    // 创建新实例
    const service = new LLMService({ provider });
    this.instances.set(provider, service);
    return service;
  }

  /**
   * 创建带自定义配置的LLM服务实例（不缓存）
   */
  static createWithConfig(config: LLMConfig & { provider?: LLMProvider }): LLMService {
    return new LLMService(config);
  }

  /**
   * 获取所有可用的提供商
   */
  static getAvailableProviders(): LLMProvider[] {
    return llmConfig.getAvailableProviders();
  }

  /**
   * 检查提供商是否可用
   */
  static isProviderAvailable(provider: LLMProvider): boolean {
    return llmConfig.isProviderAvailable(provider);
  }

  /**
   * 清除所有缓存的实例
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * 清除指定提供商的缓存实例
   */
  static clearProviderCache(provider: LLMProvider): void {
    this.instances.delete(provider);
  }

  /**
   * 获取配置摘要
   */
  static getConfigSummary(): object {
    return llmConfig.getConfigSummary();
  }
}

/**
 * 便捷的全局LLM服务实例
 */
export const defaultLLMService = LLMServiceFactory.createDefault();

/**
 * 便捷的创建函数
 */
export function createLLMService(provider?: LLMProvider): LLMService {
  return provider ? LLMServiceFactory.create(provider) : LLMServiceFactory.createDefault();
}

export default LLMServiceFactory;