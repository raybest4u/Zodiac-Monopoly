import type { CompressionConfig } from '../types/storage';

/**
 * 数据压缩服务
 */
export class CompressionService {
  private config: CompressionConfig;

  constructor(config: CompressionConfig) {
    this.config = config;
  }

  /**
   * 压缩数据
   */
  async compress(data: string): Promise<Blob> {
    if (!this.config.enabled) {
      return new Blob([data], { type: 'application/json' });
    }

    try {
      switch (this.config.algorithm) {
        case 'gzip':
          return await this.compressGzip(data);
        case 'deflate':
          return await this.compressDeflate(data);
        case 'brotli':
          return await this.compressBrotli(data);
        default:
          return await this.compressGzip(data);
      }
    } catch (error) {
      console.error('Compression failed, returning uncompressed data:', error);
      return new Blob([data], { type: 'application/json' });
    }
  }

  /**
   * 解压数据
   */
  async decompress(blob: Blob): Promise<string> {
    if (!this.config.enabled) {
      return await blob.text();
    }

    try {
      // 检查blob类型来确定压缩算法
      const type = blob.type;
      
      if (type.includes('gzip')) {
        return await this.decompressGzip(blob);
      } else if (type.includes('deflate')) {
        return await this.decompressDeflate(blob);
      } else if (type.includes('br')) {
        return await this.decompressBrotli(blob);
      } else {
        // 尝试作为未压缩数据处理
        return await blob.text();
      }
    } catch (error) {
      console.error('Decompression failed:', error);
      // 尝试作为普通文本返回
      return await blob.text();
    }
  }

  /**
   * 获取压缩阈值
   */
  getThreshold(): number {
    return this.config.threshold;
  }

  /**
   * 检查数据是否应该被压缩
   */
  shouldCompress(data: string, type?: string): boolean {
    if (!this.config.enabled) return false;
    
    const size = new Blob([data]).size;
    if (size < this.config.threshold) return false;

    if (type && this.config.excludeTypes.includes(type)) return false;

    return true;
  }

  // 私有压缩方法

  /**
   * GZIP压缩
   */
  private async compressGzip(data: string): Promise<Blob> {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // 写入数据
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(data));
    await writer.close();

    // 读取压缩结果
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    return new Blob(chunks as BlobPart[], { type: 'application/gzip' });
  }

  /**
   * GZIP解压
   */
  private async decompressGzip(blob: Blob): Promise<string> {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // 写入压缩数据
    const arrayBuffer = await blob.arrayBuffer();
    await writer.write(new Uint8Array(arrayBuffer));
    await writer.close();

    // 读取解压结果
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    const decoder = new TextDecoder();
    const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    
    for (const chunk of chunks) {
      concatenated.set(chunk, offset);
      offset += chunk.length;
    }

    return decoder.decode(concatenated);
  }

  /**
   * Deflate压缩
   */
  private async compressDeflate(data: string): Promise<Blob> {
    const stream = new CompressionStream('deflate');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    const encoder = new TextEncoder();
    await writer.write(encoder.encode(data));
    await writer.close();

    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    return new Blob(chunks as BlobPart[], { type: 'application/deflate' });
  }

  /**
   * Deflate解压
   */
  private async decompressDeflate(blob: Blob): Promise<string> {
    const stream = new DecompressionStream('deflate');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    const arrayBuffer = await blob.arrayBuffer();
    await writer.write(new Uint8Array(arrayBuffer));
    await writer.close();

    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    const decoder = new TextDecoder();
    const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    
    for (const chunk of chunks) {
      concatenated.set(chunk, offset);
      offset += chunk.length;
    }

    return decoder.decode(concatenated);
  }

  /**
   * Brotli压缩 (如果浏览器支持)
   */
  private async compressBrotli(data: string): Promise<Blob> {
    // Brotli压缩需要浏览器支持，这里提供fallback到gzip
    if (typeof CompressionStream !== 'undefined') {
      try {
        const stream = new CompressionStream('deflate-raw');
        // 实际应该是 'br' 但大多数浏览器还不支持
        return await this.compressGzip(data); // fallback
      } catch {
        return await this.compressGzip(data);
      }
    }
    return await this.compressGzip(data);
  }

  /**
   * Brotli解压
   */
  private async decompressBrotli(blob: Blob): Promise<string> {
    // Brotli解压需要浏览器支持，这里提供fallback
    try {
      return await this.decompressGzip(blob);
    } catch {
      return await blob.text();
    }
  }
}