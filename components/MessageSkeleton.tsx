'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface MessageSkeletonProps {
  isRight?: boolean;
}

export function MessageSkeleton({ isRight = false }: MessageSkeletonProps) {
  const alignment = isRight ? 'ml-auto' : 'mr-auto';
  
  return (
    <div className={cn('flex flex-col gap-1 max-w-[70%]', alignment)}>
      {/* Sender indicator skeleton */}
      <div className={cn('flex items-center gap-1 px-2', isRight && 'justify-end')}>
        <div className="h-3 w-3 rounded bg-muted animate-pulse" />
        <div className="h-3 w-12 rounded bg-muted animate-pulse" />
      </div>

      <Card className={cn(
        'p-3 rounded-2xl',
        isRight ? 'bg-blue-200/50' : 'bg-green-200/50',
        alignment
      )}>
        {/* Main content skeleton */}
        <div className="space-y-2">
          <div className="h-4 rounded bg-muted/70 animate-pulse w-full" />
          <div className="h-4 rounded bg-muted/70 animate-pulse w-3/4" />
        </div>
        
        {/* Subtitle skeleton */}
        <div className="mt-3 pt-2 border-t border-muted/30 space-y-1">
          <div className="h-3 rounded bg-muted/50 animate-pulse w-full" />
          <div className="h-3 rounded bg-muted/50 animate-pulse w-2/3" />
        </div>
      </Card>
      
      {/* Timestamp skeleton */}
      <div className={cn('px-2', isRight && 'text-right')}>
        <div className={cn('h-3 w-16 rounded bg-muted animate-pulse inline-block', isRight && 'ml-auto')} />
      </div>
    </div>
  );
}

export function MessageSkeletonGroup() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <MessageSkeleton isRight={false} />
      <MessageSkeleton isRight={true} />
      <MessageSkeleton isRight={false} />
    </div>
  );
}
