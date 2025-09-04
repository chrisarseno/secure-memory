// Hierarchical Memory Architecture with multi-tier storage
export enum MemoryTier {
  HOT = "hot",      // Frequently accessed, in-memory
  WARM = "warm",    // Moderately accessed, fast storage  
  COLD = "cold"     // Rarely accessed, compressed storage
}

export interface MemoryBlock {
  key: string;
  data: any;
  tier: MemoryTier;
  accessCount: number;
  lastAccessed: Date;
  createdAt: Date;
  sizeBytes: number;
  accessPattern: number[]; // Timestamps of recent accesses
  importanceScore: number;
  compressionRatio: number;
  serializedData?: string;
}

export interface MemoryStats {
  totalBlocks: number;
  hotTierCount: number;
  warmTierCount: number;
  coldTierCount: number;
  totalSizeBytes: number;
  averageAccessCount: number;
  cacheHitRate: number;
}

/**
 * Hierarchical Memory Architecture
 * Multi-tier memory system with hot/warm/cold storage layers
 */
export class HierarchicalMemory {
  private hotMemory: Map<string, MemoryBlock> = new Map();
  private warmMemory: Map<string, MemoryBlock> = new Map();
  private coldMemory: Map<string, MemoryBlock> = new Map();
  
  // Configuration limits
  private maxHotMemorySize: number = 50 * 1024 * 1024; // 50MB
  private maxWarmMemorySize: number = 200 * 1024 * 1024; // 200MB
  private maxHotBlocks: number = 1000;
  private maxWarmBlocks: number = 5000;
  
  // Statistics
  private accessAttempts: number = 0;
  private cacheHits: number = 0;
  
  // Background maintenance
  private maintenanceInterval: NodeJS.Timeout | null = null;

  constructor(private storage?: any) {
    this.startBackgroundMaintenance();
    this.loadPersistedMemory();
    console.log('🧠 Hierarchical Memory Architecture initialized');
  }

  /**
   * Store data in memory with automatic tier assignment
   */
  async store(key: string, data: any, priority: number = 1.0): Promise<void> {
    const sizeBytes = this.calculateSize(data);
    const now = new Date();
    
    const block: MemoryBlock = {
      key,
      data,
      tier: this.determinePriorityTier(priority, sizeBytes),
      accessCount: 0,
      lastAccessed: now,
      createdAt: now,
      sizeBytes,
      accessPattern: [],
      importanceScore: priority,
      compressionRatio: 1.0
    };
    
    await this.storeInTier(block, block.tier);
    console.log(`💾 Stored ${key} in ${block.tier} tier (${sizeBytes} bytes)`);
  }

  /**
   * Retrieve data from memory with tier promotion logic
   */
  async retrieve(key: string): Promise<any> {
    this.accessAttempts++;
    
    // Check hot tier first
    let block = this.hotMemory.get(key);
    if (block) {
      this.cacheHits++;
      this.updateAccess(block);
      return block.data;
    }
    
    // Check warm tier
    block = this.warmMemory.get(key);
    if (block) {
      this.cacheHits++;
      this.updateAccess(block);
      
      // Consider promoting to hot tier
      if (this.shouldPromoteToHot(block)) {
        await this.promoteBlock(block, MemoryTier.HOT);
      }
      
      return block.data;
    }
    
    // Check cold tier
    block = this.coldMemory.get(key);
    if (block) {
      this.cacheHits++;
      this.updateAccess(block);
      
      // Decompress if needed
      const data = block.serializedData ? JSON.parse(block.serializedData) : block.data;
      
      // Consider promoting to warm tier
      if (this.shouldPromoteToWarm(block)) {
        block.data = data; // Ensure decompressed data is available
        await this.promoteBlock(block, MemoryTier.WARM);
      }
      
      return data;
    }
    
    return null; // Not found
  }

  /**
   * Update access statistics for a memory block
   */
  private updateAccess(block: MemoryBlock): void {
    block.accessCount++;
    block.lastAccessed = new Date();
    
    // Track access pattern (keep last 50 accesses)
    block.accessPattern.push(Date.now());
    if (block.accessPattern.length > 50) {
      block.accessPattern.shift();
    }
    
    // Update importance score based on access patterns
    this.updateImportanceScore(block);
  }

  /**
   * Update importance score based on access patterns
   */
  private updateImportanceScore(block: MemoryBlock): void {
    const now = Date.now();
    const ageHours = (now - block.createdAt.getTime()) / (1000 * 60 * 60);
    
    // Frequency factor
    const frequency = Math.min(1.0, block.accessCount / (ageHours + 1) * 10);
    
    // Recency factor
    const hoursSinceAccess = (now - block.lastAccessed.getTime()) / (1000 * 60 * 60);
    const recency = Math.max(0.1, 1.0 / (1.0 + hoursSinceAccess / 24));
    
    // Pattern regularity factor
    const regularity = this.calculateAccessRegularity(block);
    
    // Combined importance score
    block.importanceScore = (
      0.4 * frequency +
      0.4 * recency +
      0.2 * regularity
    );
  }

  /**
   * Calculate access pattern regularity
   */
  private calculateAccessRegularity(block: MemoryBlock): number {
    if (block.accessPattern.length < 3) return 0.5;
    
    // Calculate intervals between accesses
    const intervals: number[] = [];
    for (let i = 1; i < block.accessPattern.length; i++) {
      intervals.push(block.accessPattern[i] - block.accessPattern[i - 1]);
    }
    
    if (intervals.length < 2) return 0.5;
    
    // Calculate coefficient of variation (lower = more regular)
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1.0;
    return Math.max(0.1, 1.0 - Math.min(1.0, coefficientOfVariation));
  }

  /**
   * Determine initial tier based on priority and size
   */
  private determinePriorityTier(priority: number, sizeBytes: number): MemoryTier {
    if (priority > 0.8 && sizeBytes < 1024 * 1024) { // High priority, small size
      return MemoryTier.HOT;
    } else if (priority > 0.5 && sizeBytes < 10 * 1024 * 1024) { // Medium priority, reasonable size
      return MemoryTier.WARM;
    } else {
      return MemoryTier.COLD;
    }
  }

  /**
   * Store block in specified tier
   */
  private async storeInTier(block: MemoryBlock, tier: MemoryTier): Promise<void> {
    // Remove from other tiers if exists
    this.removeFromAllTiers(block.key);
    
    switch (tier) {
      case MemoryTier.HOT:
        await this.ensureHotCapacity(block.sizeBytes);
        this.hotMemory.set(block.key, block);
        break;
      case MemoryTier.WARM:
        await this.ensureWarmCapacity(block.sizeBytes);
        this.warmMemory.set(block.key, block);
        break;
      case MemoryTier.COLD:
        await this.compressBlock(block);
        this.coldMemory.set(block.key, block);
        break;
    }
    
    block.tier = tier;
  }

  /**
   * Remove block from all tiers
   */
  private removeFromAllTiers(key: string): void {
    this.hotMemory.delete(key);
    this.warmMemory.delete(key);
    this.coldMemory.delete(key);
  }

  /**
   * Ensure hot tier has capacity
   */
  private async ensureHotCapacity(neededBytes: number): Promise<void> {
    while (this.hotMemory.size >= this.maxHotBlocks || 
           this.calculateTierSize(this.hotMemory) + neededBytes > this.maxHotMemorySize) {
      
      const victimBlock = this.findLeastImportantBlock(this.hotMemory);
      if (victimBlock) {
        this.hotMemory.delete(victimBlock.key);
        await this.storeInTier(victimBlock, MemoryTier.WARM);
        console.log(`🔄 Demoted ${victimBlock.key} from hot to warm tier`);
      } else {
        break; // No more blocks to demote
      }
    }
  }

  /**
   * Ensure warm tier has capacity
   */
  private async ensureWarmCapacity(neededBytes: number): Promise<void> {
    while (this.warmMemory.size >= this.maxWarmBlocks ||
           this.calculateTierSize(this.warmMemory) + neededBytes > this.maxWarmMemorySize) {
      
      const victimBlock = this.findLeastImportantBlock(this.warmMemory);
      if (victimBlock) {
        this.warmMemory.delete(victimBlock.key);
        await this.storeInTier(victimBlock, MemoryTier.COLD);
        console.log(`🔄 Demoted ${victimBlock.key} from warm to cold tier`);
      } else {
        break; // No more blocks to demote
      }
    }
  }

  /**
   * Find least important block in tier
   */
  private findLeastImportantBlock(tier: Map<string, MemoryBlock>): MemoryBlock | null {
    let leastImportant: MemoryBlock | null = null;
    let lowestScore = Infinity;
    
    Array.from(tier.values()).forEach(block => {
      if (block.importanceScore < lowestScore) {
        lowestScore = block.importanceScore;
        leastImportant = block;
      }
    });
    
    return leastImportant;
  }

  /**
   * Calculate total size of a tier
   */
  private calculateTierSize(tier: Map<string, MemoryBlock>): number {
    let totalSize = 0;
    Array.from(tier.values()).forEach(block => {
      totalSize += block.sizeBytes;
    });
    return totalSize;
  }

  /**
   * Calculate approximate size of data
   */
  private calculateSize(data: any): number {
    try {
      if (typeof data === 'string') {
        return new Blob([data]).size;
      } else if (typeof data === 'number') {
        return 8;
      } else {
        return new Blob([JSON.stringify(data)]).size;
      }
    } catch {
      return 1024; // Default size estimate
    }
  }

  /**
   * Compress block for cold storage
   */
  private async compressBlock(block: MemoryBlock): Promise<void> {
    try {
      const serialized = JSON.stringify(block.data);
      // Simple compression simulation (in real implementation, use actual compression)
      block.serializedData = serialized;
      block.compressionRatio = serialized.length / block.sizeBytes;
      
      // Clear original data to save memory
      delete block.data;
      
      console.log(`🗜️ Compressed ${block.key} with ratio ${block.compressionRatio.toFixed(2)}`);
    } catch (error) {
      console.error(`Failed to compress block ${block.key}:`, error);
    }
  }

  /**
   * Check if block should be promoted to hot tier
   */
  private shouldPromoteToHot(block: MemoryBlock): boolean {
    return block.importanceScore > 0.7 && 
           block.accessCount >= 5 && 
           this.hotMemory.size < this.maxHotBlocks;
  }

  /**
   * Check if block should be promoted to warm tier
   */
  private shouldPromoteToWarm(block: MemoryBlock): boolean {
    return block.importanceScore > 0.5 && 
           block.accessCount >= 3 &&
           this.warmMemory.size < this.maxWarmBlocks;
  }

  /**
   * Promote block to higher tier
   */
  private async promoteBlock(block: MemoryBlock, targetTier: MemoryTier): Promise<void> {
    console.log(`⬆️ Promoting ${block.key} from ${block.tier} to ${targetTier}`);
    await this.storeInTier(block, targetTier);
  }

  /**
   * Start background maintenance
   */
  private startBackgroundMaintenance(): void {
    this.maintenanceInterval = setInterval(() => {
      this.performMaintenance();
    }, 60000); // Every minute
  }

  /**
   * Perform background maintenance
   */
  private async performMaintenance(): Promise<void> {
    console.log('🔧 Performing memory maintenance...');
    
    // Update importance scores for all blocks
    const allBlocks = [
      ...Array.from(this.hotMemory.values()),
      ...Array.from(this.warmMemory.values()),
      ...Array.from(this.coldMemory.values())
    ];
    
    allBlocks.forEach(block => {
      this.updateImportanceScore(block);
    });
    
    // Check for promotion opportunities
    await this.checkPromotionOpportunities();
    
    // Clean up very old, unused blocks
    await this.cleanupOldBlocks();
    
    // Persist critical memory to storage
    await this.persistCriticalMemory();
    
    console.log('✅ Memory maintenance completed');
  }

  /**
   * Load persisted memory from storage
   */
  private async loadPersistedMemory(): Promise<void> {
    if (!this.storage) {
      console.log('📦 No storage configured - memory will not persist');
      return;
    }

    try {
      const persistedMemory = await this.storage.getPersistedMemory?.();
      if (persistedMemory && persistedMemory.length > 0) {
        console.log(`📂 Loading ${persistedMemory.length} persisted memory blocks...`);
        
        for (const memoryData of persistedMemory) {
          try {
            const block: MemoryBlock = {
              key: memoryData.key,
              data: JSON.parse(memoryData.data),
              tier: memoryData.tier as MemoryTier,
              accessCount: memoryData.accessCount || 0,
              lastAccessed: new Date(memoryData.lastAccessed),
              createdAt: new Date(memoryData.createdAt),
              sizeBytes: memoryData.sizeBytes,
              accessPattern: JSON.parse(memoryData.accessPattern || '[]'),
              importanceScore: memoryData.importanceScore || 1.0,
              compressionRatio: memoryData.compressionRatio || 1.0
            };

            // If compressed, store serialized data
            if (memoryData.serializedData) {
              block.serializedData = memoryData.serializedData;
            }

            await this.storeInTier(block, block.tier);
          } catch (error) {
            console.warn(`⚠️ Failed to load memory block ${memoryData.key}:`, error);
          }
        }
        console.log('✅ Persistent memory loaded successfully');
      } else {
        console.log('📦 No persistent memory found - starting fresh');
      }
    } catch (error) {
      console.error('❌ Failed to load persistent memory:', error);
    }
  }

  /**
   * Persist critical memory to storage
   */
  private async persistCriticalMemory(): Promise<void> {
    if (!this.storage?.savePersistedMemory) return;

    try {
      // Get all blocks that should be persisted (hot + high-importance warm)
      const criticalBlocks = [
        ...Array.from(this.hotMemory.values()),
        ...Array.from(this.warmMemory.values()).filter(b => b.importanceScore > 0.7)
      ];

      const persistedData = criticalBlocks.map(block => ({
        key: block.key,
        data: JSON.stringify(block.data),
        tier: block.tier,
        accessCount: block.accessCount,
        lastAccessed: block.lastAccessed.toISOString(),
        createdAt: block.createdAt.toISOString(),
        sizeBytes: block.sizeBytes,
        accessPattern: JSON.stringify(block.accessPattern),
        importanceScore: block.importanceScore,
        compressionRatio: block.compressionRatio,
        serializedData: block.serializedData || null
      }));

      await this.storage.savePersistedMemory(persistedData);
      console.log(`💾 Persisted ${persistedData.length} critical memory blocks`);
    } catch (error) {
      console.error('❌ Failed to persist memory:', error);
    }
  }

  /**
   * Check for promotion opportunities
   */
  private async checkPromotionOpportunities(): Promise<void> {
    // Check warm tier for hot promotions
    Array.from(this.warmMemory.values()).forEach(async (block) => {
      if (this.shouldPromoteToHot(block)) {
        await this.promoteBlock(block, MemoryTier.HOT);
      }
    });
    
    // Check cold tier for warm promotions  
    Array.from(this.coldMemory.values()).forEach(async (block) => {
      if (this.shouldPromoteToWarm(block)) {
        await this.promoteBlock(block, MemoryTier.WARM);
      }
    });
  }

  /**
   * Clean up old, unused blocks
   */
  private async cleanupOldBlocks(): Promise<void> {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    // Clean up cold tier
    const toDelete: string[] = [];
    Array.from(this.coldMemory.entries()).forEach(([key, block]) => {
      if (now - block.lastAccessed.getTime() > maxAge && block.accessCount < 2) {
        toDelete.push(key);
      }
    });
    
    toDelete.forEach(key => {
      this.coldMemory.delete(key);
      console.log(`🗑️ Cleaned up old block: ${key}`);
    });
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const allBlocks = [
      ...Array.from(this.hotMemory.values()),
      ...Array.from(this.warmMemory.values()), 
      ...Array.from(this.coldMemory.values())
    ];
    
    const totalSizeBytes = allBlocks.reduce((sum, block) => sum + block.sizeBytes, 0);
    const averageAccessCount = allBlocks.length > 0 ? 
      allBlocks.reduce((sum, block) => sum + block.accessCount, 0) / allBlocks.length : 0;
    
    const cacheHitRate = this.accessAttempts > 0 ? this.cacheHits / this.accessAttempts : 0;
    
    return {
      totalBlocks: allBlocks.length,
      hotTierCount: this.hotMemory.size,
      warmTierCount: this.warmMemory.size,
      coldTierCount: this.coldMemory.size,
      totalSizeBytes,
      averageAccessCount,
      cacheHitRate
    };
  }

  /**
   * Check if key exists in any tier
   */
  has(key: string): boolean {
    return this.hotMemory.has(key) || this.warmMemory.has(key) || this.coldMemory.has(key);
  }

  /**
   * Delete data from all tiers
   */
  delete(key: string): boolean {
    const deleted = this.hotMemory.delete(key) || 
                   this.warmMemory.delete(key) || 
                   this.coldMemory.delete(key);
    
    if (deleted) {
      console.log(`🗑️ Deleted ${key} from memory`);
    }
    
    return deleted;
  }

  /**
   * Clear all memory tiers
   */
  clear(): void {
    this.hotMemory.clear();
    this.warmMemory.clear();
    this.coldMemory.clear();
    
    this.accessAttempts = 0;
    this.cacheHits = 0;
    
    console.log('🧹 All memory tiers cleared');
  }

  /**
   * Stop background maintenance
   */
  shutdown(): void {
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = null;
    }
    console.log('🛑 Hierarchical memory system shut down');
  }
}