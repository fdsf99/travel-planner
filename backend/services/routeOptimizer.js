const mapService = require('./mapService');

/**
 * 路线优化服务
 * 使用贪心算法 + 2-opt局部优化
 *
 * 内部统一使用索引数组表示路线, attractions[i] 在距离矩阵中的索引为 i+1
 * (索引 0 是起点 startLocation)
 */
class RouteOptimizer {

  /**
   * 优化景点访问顺序
   * @param {Array} attractions - 景点列表,每个景点包含 location/longitude/latitude
   * @param {Object} startLocation - 起点位置 { longitude, latitude }
   * @param {Object} options - 可选参数
   * @returns {Promise<Array>} 优化后的景点顺序
   */
  async optimizeRoute(attractions, startLocation, options = {}) {
    const {
      considerOpeningHours = true,
      mode = 'driving'
    } = options;

    if (!attractions || attractions.length === 0) return [];
    if (attractions.length === 1) {
      return [{ ...attractions[0], order: 1, transportFromPrevious: null }];
    }

    try {
      // 步骤1: 计算距离矩阵 [起点, ...attractions]
      console.log('Calculating distance matrix...');
      const distanceMatrix = this.calculateDistanceMatrix(
        [startLocation, ...attractions]
      );

      // 步骤2: 贪心算法生成初始解(返回索引数组,元素是 attractions 的下标)
      console.log('Running greedy algorithm...');
      let orderedIndices = this.greedyNearestNeighbor(distanceMatrix, attractions.length);

      // 步骤3: 2-opt局部优化
      console.log('Running 2-opt optimization...');
      orderedIndices = this.twoOptOptimize(orderedIndices, distanceMatrix);

      // 步骤4: 根据营业时间调整(返回新数组,不修改原始顺序)
      if (considerOpeningHours) {
        console.log('Adjusting for opening hours...');
        orderedIndices = this.adjustForOpeningHours(orderedIndices, attractions);
      }

      // 步骤5: 添加交通信息
      console.log('Adding transport information...');
      return await this.addTransportInfo(orderedIndices, attractions, startLocation, mode);
    } catch (error) {
      console.error('Route optimization error:', error);
      // 降级: 返回原始顺序
      return attractions.map((a, i) => ({ ...a, order: i + 1 }));
    }
  }

  /**
   * 计算距离矩阵
   * locations[0] = 起点, locations[1..n] = 各景点
   * @private
   */
  calculateDistanceMatrix(locations) {
    const n = locations.length;
    const matrix = Array.from({ length: n }, () => new Float64Array(n).fill(Infinity));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = this.haversineDistance(
          this.getCoordinates(locations[i]),
          this.getCoordinates(locations[j])
        );
        matrix[i][j] = dist;
        matrix[j][i] = dist;
      }
    }

    return matrix;
  }

  /**
   * 提取坐标 [lng, lat]
   * @private
   */
  getCoordinates(location) {
    if (location.location?.coordinates) {
      return location.location.coordinates;
    }
    return [location.longitude, location.latitude];
  }

  /**
   * Haversine 公式计算两点间球面距离(米)
   * @private
   */
  haversineDistance(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371000;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLng = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * 贪心最近邻算法
   * 返回 attractions 索引数组(0-based),距离矩阵中对应 index+1
   * @private
   */
  greedyNearestNeighbor(distanceMatrix, count) {
    const visited = new Array(count).fill(false);
    const order = [];
    let currentMatrixIdx = 0; // 距离矩阵索引: 0 = 起点

    for (let step = 0; step < count; step++) {
      let nearestAttrIdx = -1;
      let minDist = Infinity;

      for (let i = 0; i < count; i++) {
        if (visited[i]) continue;
        const dist = distanceMatrix[currentMatrixIdx][i + 1];
        if (dist < minDist) {
          minDist = dist;
          nearestAttrIdx = i;
        }
      }

      if (nearestAttrIdx !== -1) {
        visited[nearestAttrIdx] = true;
        order.push(nearestAttrIdx);
        currentMatrixIdx = nearestAttrIdx + 1;
      }
    }

    return order;
  }

  /**
   * 2-opt局部优化(纯索引操作,避免对象比较)
   * @private
   */
  twoOptOptimize(route, distanceMatrix) {
    let best = [...route];
    const n = best.length;
    let improved = true;
    let iterations = 0;
    const maxIterations = 100;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 0; i < n - 1 && !improved; i++) {
        for (let j = i + 1; j < n && !improved; j++) {
          const newRoute = this.twoOptSwap(best, i, j);
          if (this.routeDistance(newRoute, distanceMatrix) <
              this.routeDistance(best, distanceMatrix)) {
            best = newRoute;
            improved = true;
          }
        }
      }
    }

    return best;
  }

  /**
   * 2-opt交换操作(索引数组)
   * @private
   */
  twoOptSwap(route, i, j) {
    return [
      ...route.slice(0, i),
      ...route.slice(i, j + 1).reverse(),
      ...route.slice(j + 1)
    ];
  }

  /**
   * 计算路线总距离(索引数组版本,无 indexOf)
   * distanceMatrix[0] = 起点, attractions 索引 k → matrixIdx = k+1
   * @private
   */
  routeDistance(route, distanceMatrix) {
    let total = 0;
    // 起点到第一个景点
    total += distanceMatrix[0][route[0] + 1];
    // 相邻景点之间
    for (let i = 0; i < route.length - 1; i++) {
      total += distanceMatrix[route[i] + 1][route[i + 1] + 1];
    }
    return total;
  }

  /**
   * 根据营业时间调整顺序(不修改原始数组)
   * 将没有营业时间限制的景点排在前面
   * @private
   */
  adjustForOpeningHours(orderedIndices, attractions) {
    const items = orderedIndices.map(idx => ({
      idx,
      hasHours: !!(attractions[idx].opening_hours || attractions[idx].openingHours)
    }));

    items.sort((a, b) => a.hasHours - b.hasHours);
    return items.map(item => item.idx);
  }

  /**
   * 为优化后的路线添加交通信息
   * @private
   */
  async addTransportInfo(orderedIndices, attractions, startLocation, mode) {
    const result = [];
    let previousLocation = startLocation;

    for (let i = 0; i < orderedIndices.length; i++) {
      const attraction = attractions[orderedIndices[i]];
      const [lng, lat] = this.getCoordinates(attraction);
      const currentLocation = { longitude: lng, latitude: lat };

      let transport = null;
      try {
        transport = await mapService.routePlanning(previousLocation, currentLocation, mode);
      } catch (error) {
        console.warn(`Failed to get route to ${attraction.name}:`, error.message);
      }

      result.push({
        ...attraction,
        transportFromPrevious: transport,
        order: i + 1
      });

      previousLocation = currentLocation;
    }

    return result;
  }
}

module.exports = new RouteOptimizer();
