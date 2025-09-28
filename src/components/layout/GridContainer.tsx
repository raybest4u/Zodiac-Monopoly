import React, { useMemo } from 'react';
import type { GridContainerProps, GridItemProps } from '../../types/ui-components';
import { useResponsive, getResponsiveValue } from './ResponsiveLayout';

// 网格容器组件
export const GridContainer: React.FC<GridContainerProps> = ({
  children,
  columns,
  rows,
  gap,
  areas,
  className = '',
  style = {}
}) => {
  const { viewportSize } = useResponsive();

  const gridStyle: React.CSSProperties = useMemo(() => {
    const resolvedColumns = getResponsiveValue(columns, viewportSize);
    const resolvedRows = getResponsiveValue(rows, viewportSize);
    const resolvedGap = getResponsiveValue(gap, viewportSize);
    const resolvedAreas = getResponsiveValue(areas, viewportSize);

    return {
      ...style,
      display: 'grid',
      gridTemplateColumns: resolvedColumns 
        ? (typeof resolvedColumns === 'number' 
          ? `repeat(${resolvedColumns}, 1fr)` 
          : resolvedColumns)
        : undefined,
      gridTemplateRows: resolvedRows
        ? (typeof resolvedRows === 'number'
          ? `repeat(${resolvedRows}, 1fr)`
          : resolvedRows)
        : undefined,
      gap: resolvedGap,
      gridTemplateAreas: resolvedAreas
        ? resolvedAreas.map(area => `"${area}"`).join(' ')
        : undefined,
      width: '100%',
      height: '100%'
    };
  }, [columns, rows, gap, areas, viewportSize, style]);

  return (
    <div 
      className={`grid-container ${className}`}
      style={gridStyle}
    >
      {children}
    </div>
  );
};

// 网格项组件
export const GridItem: React.FC<GridItemProps> = ({
  children,
  column,
  row,
  area,
  className = '',
  style = {}
}) => {
  const { viewportSize } = useResponsive();

  const itemStyle: React.CSSProperties = useMemo(() => {
    const resolvedColumn = getResponsiveValue(column, viewportSize);
    const resolvedRow = getResponsiveValue(row, viewportSize);
    const resolvedArea = getResponsiveValue(area, viewportSize);

    return {
      ...style,
      gridColumn: resolvedColumn,
      gridRow: resolvedRow,
      gridArea: resolvedArea
    };
  }, [column, row, area, viewportSize, style]);

  return (
    <div 
      className={`grid-item ${className}`}
      style={itemStyle}
    >
      {children}
    </div>
  );
};

// 预定义的网格布局
export const GameLayoutGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <GridContainer
      areas={{
        mobile: [
          'header',
          'board',
          'player-info',
          'controls',
          'messages'
        ],
        tablet: [
          'header header',
          'board controls',
          'player-info controls',
          'messages messages'
        ],
        desktop: [
          'header header header',
          'player-info board controls',
          'messages messages messages'
        ],
        large: [
          'header header header header',
          'player-info board board controls',
          'messages messages messages messages'
        ]
      }}
      columns={{
        mobile: 1,
        tablet: 2,
        desktop: 3,
        large: 4
      }}
      rows={{
        mobile: 5,
        tablet: 4,
        desktop: 3,
        large: 3
      }}
      gap={{
        mobile: '8px',
        tablet: '12px',
        desktop: '16px',
        large: '20px'
      }}
      className={`game-layout-grid ${className}`}
    >
      {children}
    </GridContainer>
  );
};

// 双环棋盘专用网格布局
export const DualRingBoardGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <GridContainer
      columns={{
        mobile: 1,
        tablet: 1,
        desktop: 3,
        large: 3
      }}
      areas={{
        mobile: [
          'board',
          'center-info',
          'connections'
        ],
        tablet: [
          'board',
          'center-info',
          'connections'
        ],
        desktop: [
          'board center-info connections'
        ],
        large: [
          'board center-info connections'
        ]
      }}
      gap={{
        mobile: '12px',
        tablet: '16px',
        desktop: '20px',
        large: '24px'
      }}
      className={`dual-ring-board-grid ${className}`}
    >
      {children}
    </GridContainer>
  );
};

export default GridContainer;