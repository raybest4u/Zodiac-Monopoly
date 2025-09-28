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
  // 外环地产价格
  if (position < 100) {
    // 特殊位置没有价格
    if ([0, 10, 20, 30].includes(position)) return 0; // 起点、监狱、免费停车、入狱
    if ([2, 7, 17, 22, 33, 36].includes(position)) return 0; // 机会、命运
    
    // 车站和电厂
    if ([5, 15, 25, 35].includes(position)) return 200; // 车站
    if ([12, 28].includes(position)) return 150; // 电厂
    
    // 普通地产
    const propertyPrices = [60, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 350, 400];
    const propertyPositions = [1, 3, 4, 6, 8, 9, 11, 13, 14, 16, 18, 19, 21, 23, 24, 26, 27, 29, 31, 32, 34, 37, 38, 39];
    const index = propertyPositions.indexOf(position);
    return index >= 0 ? propertyPrices[index % propertyPrices.length] : 100;
  }
  
  // 内环地产价格
  const innerIndex = position - 100;
  if ([0, 6, 12, 18].includes(innerIndex)) return 0; // 特殊位置
  if ([3, 9, 15, 21].includes(innerIndex)) return 0; // 传送门
  if ([1, 7, 13, 19].includes(innerIndex)) return 300; // 生肖殿
  
  // 内环普通地产
  const innerPrices = [400, 450, 500, 550, 600, 650, 700, 750, 800];
  const innerPropertyPositions = [2, 4, 5, 8, 10, 11, 14, 16, 17, 20, 22, 23];
  const innerIndex2 = innerPropertyPositions.indexOf(innerIndex);
  return innerIndex2 >= 0 ? innerPrices[innerIndex2 % innerPrices.length] : 400;
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
  if (position < 100) {
    if ([0, 10, 20, 30].includes(position)) return 'special';
    if ([2, 7, 17, 22, 33, 36].includes(position)) return 'chance';
    if ([5, 15, 25, 35].includes(position)) return 'station';
    if ([12, 28].includes(position)) return 'utility';
    return 'property';
  } else {
    const innerIndex = position - 100;
    if ([0, 6, 12, 18].includes(innerIndex)) return 'special';
    if ([3, 9, 15, 21].includes(innerIndex)) return 'portal';
    if ([1, 7, 13, 19].includes(innerIndex)) return 'zodiac_temple';
    return 'property';
  }
}