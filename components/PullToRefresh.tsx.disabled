'use client';

import { useState, useRef, ReactNode } from 'react';
import { LoadingOutlined, DownOutlined } from '@ant-design/icons';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 80 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const getRefreshText = () => {
    if (isRefreshing) return 'កំពុងផ្ទុកឡើងវិញ...';
    if (pullDistance >= threshold) return 'ដោះលែងដើម្បីផ្ទុកឡើងវិញ';
    return 'ទាញចុះដើម្បីផ្ទុកឡើងវិញ';
  };

  const getRefreshIcon = () => {
    if (isRefreshing) return <LoadingOutlined spin />;
    if (pullDistance >= threshold) return <DownOutlined style={{ transform: 'rotate(180deg)' }} />;
    return <DownOutlined />;
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className={`pull-to-refresh ${pullDistance > 0 ? 'active' : ''}`}
        style={{
          height: pullDistance,
          opacity: Math.min(pullDistance / threshold, 1),
        }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-2xl mb-1">{getRefreshIcon()}</div>
            <div className="text-sm text-gray-600">{getRefreshText()}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s',
        }}
      >
        {children}
      </div>
    </div>
  );
}