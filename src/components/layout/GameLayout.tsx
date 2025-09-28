import React from 'react';
import type { GameLayoutProps } from '../../types/ui-components';
import { useResponsive } from './ResponsiveLayout';
import { GridContainer, GridItem } from './GridContainer';
import './GameLayout.css';

export const GameLayout: React.FC<GameLayoutProps> = ({
  children,
  mode,
  sidebar,
  header,
  footer,
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  // 根据设备类型自动选择模式
  const layoutMode = mode || (isMobile ? 'mobile' : 'desktop');

  if (layoutMode === 'mobile') {
    return <MobileGameLayout 
      header={header} 
      footer={footer} 
      className={className}
    >
      {children}
    </MobileGameLayout>;
  }

  return <DesktopGameLayout 
    sidebar={sidebar} 
    header={header} 
    footer={footer} 
    className={className}
  >
    {children}
  </DesktopGameLayout>;
};

// 桌面端布局
const DesktopGameLayout: React.FC<{
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}> = ({ children, sidebar, header, footer, className = '' }) => {
  return (
    <div className={`desktop-game-layout ${className}`}>
      {header && (
        <GridItem area="header" className="game-header">
          {header}
        </GridItem>
      )}
      
      <GridContainer
        areas={{
          desktop: sidebar ? 
            ['sidebar main-content controls'] : 
            ['main-content main-content controls'],
          large: sidebar ? 
            ['sidebar main-content main-content controls'] : 
            ['main-content main-content main-content controls']
        }}
        columns={{
          desktop: sidebar ? 3 : 2,
          large: sidebar ? 4 : 3
        }}
        gap="16px"
        className="game-main-grid"
      >
        {sidebar && (
          <GridItem area="sidebar" className="game-sidebar">
            {sidebar}
          </GridItem>
        )}
        
        <GridItem area="main-content" className="game-main-content">
          {children}
        </GridItem>
        
        <GridItem area="controls" className="game-controls">
          {/* 控制面板将在这里渲染 */}
        </GridItem>
      </GridContainer>
      
      {footer && (
        <GridItem area="footer" className="game-footer">
          {footer}
        </GridItem>
      )}
    </div>
  );
};

// 移动端布局
const MobileGameLayout: React.FC<{
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}> = ({ children, header, footer, className = '' }) => {
  return (
    <div className={`mobile-game-layout ${className}`}>
      {header && (
        <div className="mobile-header">
          {header}
        </div>
      )}
      
      <div className="mobile-main-content">
        {children}
      </div>
      
      {footer && (
        <div className="mobile-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

// 游戏头部组件
export const GameHeader: React.FC<{
  title: string;
  subtitle?: string;
  season?: string;
  round?: number;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  className?: string;
}> = ({
  title,
  subtitle,
  season,
  round,
  leftActions,
  rightActions,
  className = ''
}) => {
  const { isMobile } = useResponsive();
  
  return (
    <header className={`game-header ${isMobile ? 'mobile' : 'desktop'} ${className}`}>
      <div className="header-left">
        {leftActions}
        <div className="header-title">
          <h1>{title}</h1>
          {subtitle && <span className="subtitle">{subtitle}</span>}
        </div>
      </div>
      
      <div className="header-center">
        {season && (
          <div className="season-indicator">
            <span className="season-icon">🌸</span>
            <span className="season-text">{season}</span>
          </div>
        )}
      </div>
      
      <div className="header-right">
        {round && (
          <div className="round-indicator">
            <span className="round-text">第{round}回合</span>
          </div>
        )}
        {rightActions}
      </div>
    </header>
  );
};

// 游戏主内容区组件
export const GameMainContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <main className={`game-main-content ${className}`}>
      {children}
    </main>
  );
};

// 游戏侧边栏组件
export const GameSidebar: React.FC<{
  children: React.ReactNode;
  position?: 'left' | 'right';
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}> = ({
  children,
  position = 'left',
  collapsible = false,
  collapsed = false,
  onToggle,
  className = ''
}) => {
  return (
    <aside className={`game-sidebar ${position} ${collapsed ? 'collapsed' : ''} ${className}`}>
      {collapsible && (
        <button 
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? '→' : '←'}
        </button>
      )}
      <div className="sidebar-content">
        {children}
      </div>
    </aside>
  );
};

export default GameLayout;