/**
 * 地产操作辅助函数
 * 为GameEngine提供地产相关的辅助功能
 */

export interface PropertyInfo {
  position: number;
  price: number;
  level: number;
  rent: number;
}

export interface RentInfo {
  owner: any;
  rentAmount: number;
}

/**
 * 获取地产价格
 */
export function getPropertyPrice(position: number): number {
  // 标准40格大富翁棋盘
  if (position < 0 || position >= 40) return 0;
  
  // 特殊位置没有价格
  if ([0, 10, 20, 30].includes(position)) return 0; // 起点、监狱、免费停车、入狱
  if ([2, 7, 17, 22, 33, 36].includes(position)) return 0; // 机会、命运
  if ([4, 38].includes(position)) return 0; // 税收
  
  // 车站和公用事业
  if ([5, 15, 25, 35].includes(position)) return 200; // 车站
  if ([12, 28].includes(position)) return 150; // 电厂/水厂
  
  // 普通地产 - 简化为基于位置的递增价格
  // 第一组 (1,3): 60-80
  if (position === 1) return 60;
  if (position === 3) return 80;
  
  // 第二组 (6,8,9): 100-140  
  if ([6, 8, 9].includes(position)) return 100 + (position - 6) * 20;
  
  // 第三组 (11,13,14): 140-180
  if ([11, 13, 14].includes(position)) return 140 + (position - 11) * 20;
  
  // 第四组 (16,18,19): 180-220
  if ([16, 18, 19].includes(position)) return 180 + (position - 16) * 20;
  
  // 第五组 (21,23,24): 220-260
  if ([21, 23, 24].includes(position)) return 220 + (position - 21) * 20;
  
  // 第六组 (26,27,29): 260-300
  if ([26, 27, 29].includes(position)) return 260 + (position - 26) * 20;
  
  // 第七组 (31,32,34): 300-350
  if ([31, 32, 34].includes(position)) return 300 + (position - 31) * 25;
  
  // 第八组 (37,39): 350-400
  if ([37, 39].includes(position)) return 350 + (position - 37) * 25;
  
  // 默认返回0（特殊位置）
  return 0;
}

/**
 * 检查是否可以购买地产
 */
export function canBuyProperty(position: number, player: any): boolean {
  const price = getPropertyPrice(position);
  if (price === 0) return false; // 特殊位置不能购买
  
  // 检查是否已经拥有该地产
  const alreadyOwned = player.properties?.some((p: any) => p.position === position);
  if (alreadyOwned) return false;
  
  // 检查资金是否充足
  return player.money >= price;
}

/**
 * 获取租金信息
 */
export function getRentInfo(position: number, currentPlayer: any, allPlayers: any[]): RentInfo {
  // 查找拥有该位置地产的玩家
  const owner = allPlayers.find(player => 
    player.id !== currentPlayer.id && 
    player.properties?.some((p: any) => p.position === position)
  );
  
  if (!owner) {
    return { owner: null, rentAmount: 0 };
  }
  
  // 找到该地产信息
  const property = owner.properties.find((p: any) => p.position === position);
  if (!property) {
    return { owner: null, rentAmount: 0 };
  }
  
  // 计算租金（基础租金 * 等级）
  const baseRent = Math.floor(property.price * 0.1);
  const rentAmount = baseRent * (property.level || 1);
  
  return { owner, rentAmount };
}

/**
 * 检查是否需要支付租金
 */
export function needsToPayRent(position: number, currentPlayer: any, allPlayers: any[]): boolean {
  const { owner, rentAmount } = getRentInfo(position, currentPlayer, allPlayers);
  return owner !== null && rentAmount > 0;
}

/**
 * 检查是否可以升级地产
 */
export function canUpgradeProperty(position: number, player: any): boolean {
  const property = player.properties?.find((p: any) => p.position === position);
  if (!property) return false;
  
  const upgradeCost = Math.floor(property.price * 0.5);
  return player.money >= upgradeCost && (property.level || 1) < 5; // 最多升级到5级
}

/**
 * 获取地产类型
 */
export function getPropertyType(position: number): string {
  // 标准40格大富翁棋盘
  if (position < 0 || position >= 40) return 'special';
  
  if ([0, 10, 20, 30].includes(position)) return 'special'; // 起点、监狱、免费停车、入狱
  if ([2, 7, 17, 22, 33, 36].includes(position)) return 'chance'; // 机会、命运
  if ([4, 38].includes(position)) return 'tax'; // 税收
  if ([5, 15, 25, 35].includes(position)) return 'station'; // 车站
  if ([12, 28].includes(position)) return 'utility'; // 电厂/水厂
  
  // 所有其他位置都是可购买的地产
  return 'property';
}