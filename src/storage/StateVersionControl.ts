import type { GameState, Player, PlayerAction } from '../types/game';

export interface VersionInfo {
  id: string;
  version: number;
  parentVersion?: number;
  branchName: string;
  timestamp: number;
  author: string;
  message: string;
  checksum: string;
  size: number;
  tags: string[];
}

export interface VersionDiff {
  fromVersion: number;
  toVersion: number;
  changes: VersionChange[];
  addedSize: number;
  removedSize: number;
  modifiedCount: number;
}

export interface VersionChange {
  type: 'add' | 'remove' | 'modify';
  path: string;
  oldValue?: any;
  newValue?: any;
  timestamp: number;
  reason?: string;
}

export interface VersionBranch {
  name: string;
  baseVersion: number;
  currentVersion: number;
  created: number;
  lastUpdate: number;
  description: string;
  isProtected: boolean;
  versions: number[];
}

export interface VersionTag {
  name: string;
  version: number;
  created: number;
  description: string;
  isAutomated: boolean;
}

export interface MergeResult {
  success: boolean;
  targetVersion: number;
  conflicts: MergeConflict[];
  resolvedChanges: VersionChange[];
  message?: string;
}

export interface MergeConflict {
  path: string;
  baseValue: any;
  sourceValue: any;
  targetValue: any;
  resolution?: 'source' | 'target' | 'manual';
  resolvedValue?: any;
}

export interface VersionQuery {
  branch?: string;
  fromVersion?: number;
  toVersion?: number;
  author?: string;
  fromDate?: number;
  toDate?: number;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface VersionControlConfig {
  maxVersionsPerBranch: number;
  enableAutoTagging: boolean;
  compressionThreshold: number;
  cleanupIntervalMs: number;
  maxBranches: number;
  defaultBranch: string;
  enableBranchProtection: boolean;
  maxDiffSize: number;
}

export class StateVersionControl {
  private versions = new Map<number, VersionInfo>();
  private versionData = new Map<number, GameState>();
  private branches = new Map<string, VersionBranch>();
  private tags = new Map<string, VersionTag>();
  private currentVersion = 0;
  private currentBranch = 'main';
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private config: VersionControlConfig) {
    this.initializeMainBranch();
    this.startPeriodicCleanup();
  }

  private initializeMainBranch(): void {
    const mainBranch: VersionBranch = {
      name: this.config.defaultBranch,
      baseVersion: 0,
      currentVersion: 0,
      created: Date.now(),
      lastUpdate: Date.now(),
      description: 'Main development branch',
      isProtected: this.config.enableBranchProtection,
      versions: []
    };

    this.branches.set(this.config.defaultBranch, mainBranch);
    this.currentBranch = this.config.defaultBranch;
  }

  private startPeriodicCleanup(): void {
    if (this.config.cleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(async () => {
        await this.performCleanup();
      }, this.config.cleanupIntervalMs);
    }
  }

  async commit(
    gameState: GameState,
    message: string,
    author: string,
    tags: string[] = []
  ): Promise<{success: boolean; version?: number; error?: string}> {
    try {
      const newVersion = ++this.currentVersion;
      const timestamp = Date.now();
      const checksum = await this.calculateChecksum(gameState);
      const size = this.calculateSize(gameState);

      const versionId = `v${newVersion}_${timestamp}`;

      const versionInfo: VersionInfo = {
        id: versionId,
        version: newVersion,
        parentVersion: this.getCurrentBranchVersion(),
        branchName: this.currentBranch,
        timestamp,
        author,
        message,
        checksum,
        size,
        tags: [...tags]
      };

      if (this.config.enableAutoTagging) {
        this.addAutoTags(versionInfo, gameState);
      }

      this.versions.set(newVersion, versionInfo);
      this.versionData.set(newVersion, this.deepClone(gameState));

      await this.updateBranch(this.currentBranch, newVersion);

      for (const tag of tags) {
        await this.createTag(tag, newVersion, `Tagged during commit: ${message}`);
      }

      await this.enforceVersionLimits();

      return { success: true, version: newVersion };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Commit failed'
      };
    }
  }

  async checkout(
    target: number | string
  ): Promise<{success: boolean; gameState?: GameState; version?: number; error?: string}> {
    try {
      let targetVersion: number;

      if (typeof target === 'string') {
        if (this.branches.has(target)) {
          targetVersion = this.branches.get(target)!.currentVersion;
          this.currentBranch = target;
        } else if (this.tags.has(target)) {
          targetVersion = this.tags.get(target)!.version;
        } else {
          return { success: false, error: 'Branch or tag not found' };
        }
      } else {
        targetVersion = target;
      }

      const versionInfo = this.versions.get(targetVersion);
      if (!versionInfo) {
        return { success: false, error: 'Version not found' };
      }

      const gameState = this.versionData.get(targetVersion);
      if (!gameState) {
        return { success: false, error: 'Version data not found' };
      }

      const isValid = await this.validateChecksum(gameState, versionInfo.checksum);
      if (!isValid) {
        return { success: false, error: 'Version data integrity check failed' };
      }

      return {
        success: true,
        gameState: this.deepClone(gameState),
        version: targetVersion
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout failed'
      };
    }
  }

  async createBranch(
    branchName: string,
    baseVersion?: number,
    description = ''
  ): Promise<{success: boolean; error?: string}> {
    try {
      if (this.branches.has(branchName)) {
        return { success: false, error: 'Branch already exists' };
      }

      if (this.branches.size >= this.config.maxBranches) {
        return { success: false, error: 'Maximum number of branches reached' };
      }

      const base = baseVersion || this.getCurrentBranchVersion();
      const baseVersionInfo = this.versions.get(base);
      
      if (!baseVersionInfo) {
        return { success: false, error: 'Base version not found' };
      }

      const branch: VersionBranch = {
        name: branchName,
        baseVersion: base,
        currentVersion: base,
        created: Date.now(),
        lastUpdate: Date.now(),
        description,
        isProtected: false,
        versions: [base]
      };

      this.branches.set(branchName, branch);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Branch creation failed'
      };
    }
  }

  async mergeBranch(
    sourceBranch: string,
    targetBranch: string,
    resolveConflicts: (conflicts: MergeConflict[]) => Promise<{[path: string]: any}>
  ): Promise<MergeResult> {
    try {
      const source = this.branches.get(sourceBranch);
      const target = this.branches.get(targetBranch);

      if (!source || !target) {
        return {
          success: false,
          targetVersion: 0,
          conflicts: [],
          resolvedChanges: [],
          message: 'Source or target branch not found'
        };
      }

      const baseVersion = this.findCommonAncestor(source, target);
      const sourceVersion = source.currentVersion;
      const targetVersion = target.currentVersion;

      const conflicts = await this.detectConflicts(baseVersion, sourceVersion, targetVersion);

      if (conflicts.length > 0) {
        const resolutions = await resolveConflicts(conflicts);
        for (const conflict of conflicts) {
          if (resolutions[conflict.path] !== undefined) {
            conflict.resolution = 'manual';
            conflict.resolvedValue = resolutions[conflict.path];
          }
        }
      }

      const mergedState = await this.performMerge(
        baseVersion,
        sourceVersion,
        targetVersion,
        conflicts
      );

      const newVersion = await this.commit(
        mergedState,
        `Merge ${sourceBranch} into ${targetBranch}`,
        'system'
      );

      if (!newVersion.success) {
        return {
          success: false,
          targetVersion: 0,
          conflicts,
          resolvedChanges: [],
          message: newVersion.error
        };
      }

      return {
        success: true,
        targetVersion: newVersion.version!,
        conflicts,
        resolvedChanges: await this.calculateChanges(targetVersion, newVersion.version!)
      };
    } catch (error) {
      return {
        success: false,
        targetVersion: 0,
        conflicts: [],
        resolvedChanges: [],
        message: error instanceof Error ? error.message : 'Merge failed'
      };
    }
  }

  async createTag(
    tagName: string,
    version: number,
    description = '',
    isAutomated = false
  ): Promise<{success: boolean; error?: string}> {
    try {
      if (this.tags.has(tagName)) {
        return { success: false, error: 'Tag already exists' };
      }

      const versionInfo = this.versions.get(version);
      if (!versionInfo) {
        return { success: false, error: 'Version not found' };
      }

      const tag: VersionTag = {
        name: tagName,
        version,
        created: Date.now(),
        description,
        isAutomated
      };

      this.tags.set(tagName, tag);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tag creation failed'
      };
    }
  }

  async diff(
    fromVersion: number,
    toVersion: number
  ): Promise<{success: boolean; diff?: VersionDiff; error?: string}> {
    try {
      const fromState = this.versionData.get(fromVersion);
      const toState = this.versionData.get(toVersion);

      if (!fromState || !toState) {
        return { success: false, error: 'One or both versions not found' };
      }

      const changes = await this.calculateChanges(fromVersion, toVersion);
      const addedSize = this.calculateSize(toState) - this.calculateSize(fromState);

      const diff: VersionDiff = {
        fromVersion,
        toVersion,
        changes,
        addedSize,
        removedSize: addedSize < 0 ? Math.abs(addedSize) : 0,
        modifiedCount: changes.length
      };

      return { success: true, diff };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Diff calculation failed'
      };
    }
  }

  async getVersionHistory(query: VersionQuery = {}): Promise<VersionInfo[]> {
    let results = Array.from(this.versions.values());

    if (query.branch) {
      const branch = this.branches.get(query.branch);
      if (branch) {
        results = results.filter(v => branch.versions.includes(v.version));
      }
    }

    if (query.fromVersion !== undefined) {
      results = results.filter(v => v.version >= query.fromVersion!);
    }

    if (query.toVersion !== undefined) {
      results = results.filter(v => v.version <= query.toVersion!);
    }

    if (query.author) {
      results = results.filter(v => v.author === query.author);
    }

    if (query.fromDate !== undefined) {
      results = results.filter(v => v.timestamp >= query.fromDate!);
    }

    if (query.toDate !== undefined) {
      results = results.filter(v => v.timestamp <= query.toDate!);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(v => 
        query.tags!.some(tag => v.tags.includes(tag))
      );
    }

    results.sort((a, b) => b.version - a.version);

    if (query.offset) {
      results = results.slice(query.offset);
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  private addAutoTags(versionInfo: VersionInfo, gameState: GameState): void {
    if (gameState.round % 10 === 0) {
      versionInfo.tags.push(`round-${gameState.round}`);
    }

    if (gameState.status === 'finished') {
      versionInfo.tags.push('game-end');
    }

    if (gameState.players.some(p => p.money <= 0)) {
      versionInfo.tags.push('bankruptcy');
    }

    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      versionInfo.tags.push('weekend-save');
    }
  }

  private getCurrentBranchVersion(): number {
    const branch = this.branches.get(this.currentBranch);
    return branch ? branch.currentVersion : 0;
  }

  private async updateBranch(branchName: string, version: number): Promise<void> {
    const branch = this.branches.get(branchName);
    if (branch) {
      branch.currentVersion = version;
      branch.lastUpdate = Date.now();
      branch.versions.push(version);

      if (branch.versions.length > this.config.maxVersionsPerBranch) {
        branch.versions = branch.versions.slice(-this.config.maxVersionsPerBranch);
      }
    }
  }

  private findCommonAncestor(branch1: VersionBranch, branch2: VersionBranch): number {
    const versions1 = new Set(branch1.versions);
    const versions2 = branch2.versions.slice().reverse();

    for (const version of versions2) {
      if (versions1.has(version)) {
        return version;
      }
    }

    return Math.min(branch1.baseVersion, branch2.baseVersion);
  }

  private async detectConflicts(
    baseVersion: number,
    sourceVersion: number,
    targetVersion: number
  ): Promise<MergeConflict[]> {
    const baseState = this.versionData.get(baseVersion);
    const sourceState = this.versionData.get(sourceVersion);
    const targetState = this.versionData.get(targetVersion);

    if (!baseState || !sourceState || !targetState) {
      return [];
    }

    const sourceChanges = this.deepDiff(baseState, sourceState);
    const targetChanges = this.deepDiff(baseState, targetState);

    const conflicts: MergeConflict[] = [];

    for (const sourceChange of sourceChanges) {
      const conflictingTargetChange = targetChanges.find(tc => tc.path === sourceChange.path);
      
      if (conflictingTargetChange && 
          JSON.stringify(sourceChange.newValue) !== JSON.stringify(conflictingTargetChange.newValue)) {
        conflicts.push({
          path: sourceChange.path,
          baseValue: this.getValueAtPath(baseState, sourceChange.path),
          sourceValue: sourceChange.newValue,
          targetValue: conflictingTargetChange.newValue
        });
      }
    }

    return conflicts;
  }

  private async performMerge(
    baseVersion: number,
    sourceVersion: number,
    targetVersion: number,
    conflicts: MergeConflict[]
  ): Promise<GameState> {
    const targetState = this.deepClone(this.versionData.get(targetVersion)!);
    const sourceState = this.versionData.get(sourceVersion)!;
    const baseState = this.versionData.get(baseVersion)!;

    const sourceChanges = this.deepDiff(baseState, sourceState);

    for (const change of sourceChanges) {
      const conflict = conflicts.find(c => c.path === change.path);
      
      if (conflict && conflict.resolvedValue !== undefined) {
        this.setValueAtPath(targetState, change.path, conflict.resolvedValue);
      } else if (!conflict) {
        this.setValueAtPath(targetState, change.path, change.newValue);
      }
    }

    return targetState;
  }

  private async calculateChanges(fromVersion: number, toVersion: number): Promise<VersionChange[]> {
    const fromState = this.versionData.get(fromVersion);
    const toState = this.versionData.get(toVersion);

    if (!fromState || !toState) {
      return [];
    }

    return this.deepDiff(fromState, toState);
  }

  private deepDiff(obj1: any, obj2: any, path = ''): VersionChange[] {
    const changes: VersionChange[] = [];

    if (typeof obj1 !== typeof obj2) {
      changes.push({
        type: 'modify',
        path,
        oldValue: obj1,
        newValue: obj2,
        timestamp: Date.now()
      });
      return changes;
    }

    if (typeof obj1 === 'object' && obj1 !== null) {
      const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
      
      for (const key of keys) {
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj1)) {
          changes.push({
            type: 'add',
            path: newPath,
            newValue: obj2[key],
            timestamp: Date.now()
          });
        } else if (!(key in obj2)) {
          changes.push({
            type: 'remove',
            path: newPath,
            oldValue: obj1[key],
            timestamp: Date.now()
          });
        } else {
          changes.push(...this.deepDiff(obj1[key], obj2[key], newPath));
        }
      }
    } else if (obj1 !== obj2) {
      changes.push({
        type: 'modify',
        path,
        oldValue: obj1,
        newValue: obj2,
        timestamp: Date.now()
      });
    }

    return changes;
  }

  private getValueAtPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setValueAtPath(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private deepClone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  private async calculateChecksum(data: any): Promise<string> {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private async validateChecksum(data: any, expectedChecksum: string): Promise<boolean> {
    const actualChecksum = await this.calculateChecksum(data);
    return actualChecksum === expectedChecksum;
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private async enforceVersionLimits(): Promise<void> {
    for (const [branchName, branch] of this.branches) {
      if (branch.versions.length > this.config.maxVersionsPerBranch && !branch.isProtected) {
        const versionsToRemove = branch.versions.slice(0, -this.config.maxVersionsPerBranch);
        
        for (const version of versionsToRemove) {
          this.versions.delete(version);
          this.versionData.delete(version);
        }
        
        branch.versions = branch.versions.slice(-this.config.maxVersionsPerBranch);
      }
    }
  }

  private async performCleanup(): Promise<void> {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30天前

    const oldVersions = Array.from(this.versions.values())
      .filter(v => v.timestamp < cutoffTime && !v.tags.includes('protected'));

    for (const version of oldVersions) {
      this.versions.delete(version.version);
      this.versionData.delete(version.version);
    }

    const oldTags = Array.from(this.tags.values())
      .filter(t => t.created < cutoffTime && t.isAutomated);

    for (const tag of oldTags) {
      this.tags.delete(tag.name);
    }
  }

  getBranches(): VersionBranch[] {
    return Array.from(this.branches.values());
  }

  getTags(): VersionTag[] {
    return Array.from(this.tags.values()).sort((a, b) => b.created - a.created);
  }

  getCurrentBranch(): string {
    return this.currentBranch;
  }

  switchBranch(branchName: string): {success: boolean; error?: string} {
    if (!this.branches.has(branchName)) {
      return { success: false, error: 'Branch not found' };
    }

    this.currentBranch = branchName;
    return { success: true };
  }

  async cleanup(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.versions.clear();
    this.versionData.clear();
    this.branches.clear();
    this.tags.clear();
  }
}