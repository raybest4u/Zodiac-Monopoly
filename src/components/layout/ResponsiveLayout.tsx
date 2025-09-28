import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { 
  ResponsiveLayoutProps, 
  ResponsiveBreakpoints, 
  ViewportSize, 
  ResponsiveConfig 
} from '../../types/ui-components';

// 默认断点配置
const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  large: 1920
};

// 响应式上下文
interface ResponsiveContextValue {
  viewportSize: ViewportSize;
  breakpoints: ResponsiveBreakpoints;
  windowWidth: number;
  windowHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextValue | null>(null);

// 获取当前视口尺寸
function getViewportSize(width: number, breakpoints: ResponsiveBreakpoints): ViewportSize {
  if (width < breakpoints.mobile) return 'mobile';
  if (width < breakpoints.tablet) return 'tablet';
  if (width < breakpoints.desktop) return 'desktop';
  return 'large';
}

// 响应式提供者组件
export const ResponsiveProvider: React.FC<{
  children: React.ReactNode;
  breakpoints?: Partial<ResponsiveBreakpoints>;
}> = ({ children, breakpoints: customBreakpoints }) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const breakpoints = useMemo(() => ({
    ...DEFAULT_BREAKPOINTS,
    ...customBreakpoints
  }), [customBreakpoints]);

  // 监听窗口大小变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    // 初始化时获取当前窗口大小
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value = useMemo((): ResponsiveContextValue => {
    const viewportSize = getViewportSize(windowSize.width, breakpoints);
    
    return {
      viewportSize,
      breakpoints,
      windowWidth: windowSize.width,
      windowHeight: windowSize.height,
      isMobile: viewportSize === 'mobile',
      isTablet: viewportSize === 'tablet',
      isDesktop: viewportSize === 'desktop',
      isLarge: viewportSize === 'large'
    };
  }, [windowSize, breakpoints]);

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// 响应式Hook
export const useResponsive = (): ResponsiveContextValue => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
};

// 获取响应式值的工具函数
export function getResponsiveValue<T>(
  config: ResponsiveConfig<T> | T,
  viewportSize: ViewportSize
): T {
  if (typeof config !== 'object' || config === null) {
    return config as T;
  }

  const responsiveConfig = config as ResponsiveConfig<T>;
  
  // 按优先级获取值
  switch (viewportSize) {
    case 'mobile':
      return responsiveConfig.mobile ?? responsiveConfig.tablet ?? responsiveConfig.desktop ?? responsiveConfig.large as T;
    case 'tablet':
      return responsiveConfig.tablet ?? responsiveConfig.mobile ?? responsiveConfig.desktop ?? responsiveConfig.large as T;
    case 'desktop':
      return responsiveConfig.desktop ?? responsiveConfig.tablet ?? responsiveConfig.large ?? responsiveConfig.mobile as T;
    case 'large':
      return responsiveConfig.large ?? responsiveConfig.desktop ?? responsiveConfig.tablet ?? responsiveConfig.mobile as T;
    default:
      return responsiveConfig.desktop ?? responsiveConfig.tablet ?? responsiveConfig.mobile ?? responsiveConfig.large as T;
  }
}

// 响应式布局容器组件
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  maxWidth,
  padding,
  columns,
  gap,
  className = '',
  style = {}
}) => {
  const { viewportSize } = useResponsive();

  const containerStyle: React.CSSProperties = useMemo(() => {
    const resolvedMaxWidth = getResponsiveValue(maxWidth, viewportSize);
    const resolvedPadding = getResponsiveValue(padding, viewportSize);
    const resolvedColumns = getResponsiveValue(columns, viewportSize);
    const resolvedGap = getResponsiveValue(gap, viewportSize);

    return {
      ...style,
      maxWidth: resolvedMaxWidth,
      padding: resolvedPadding,
      display: resolvedColumns ? 'grid' : 'block',
      gridTemplateColumns: resolvedColumns ? `repeat(${resolvedColumns}, 1fr)` : undefined,
      gap: resolvedGap,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    };
  }, [maxWidth, padding, columns, gap, viewportSize, style]);

  return (
    <div 
      className={`responsive-layout ${className}`}
      style={containerStyle}
    >
      {children}
    </div>
  );
};

// CSS媒体查询生成器
export const generateMediaQuery = (
  breakpoint: keyof ResponsiveBreakpoints,
  type: 'min' | 'max' = 'min',
  breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS
): string => {
  const value = breakpoints[breakpoint];
  return `@media (${type}-width: ${type === 'min' ? value : value - 1}px)`;
};

// CSS变量生成器
export const generateCSSVariables = (
  config: Record<string, ResponsiveConfig<string | number>>,
  viewportSize: ViewportSize
): React.CSSProperties => {
  const variables: Record<string, string> = {};
  
  Object.entries(config).forEach(([key, value]) => {
    const resolvedValue = getResponsiveValue(value, viewportSize);
    variables[`--${key}`] = String(resolvedValue);
  });
  
  return variables as React.CSSProperties;
};

export default ResponsiveLayout;