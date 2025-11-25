"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/react-ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/react-ui/card';
import { Progress } from '@/components/react-ui/progress';
import { Button } from '@/components/react-ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/react-ui/tooltip';
import { Calendar, Clock, Target, AlertTriangle, CheckCircle, Circle, Pause } from 'lucide-react';
import type { ProjectFeature, TimelineNode, SessionLog } from '@/lib/types/dev-progress';
import { cn } from '@/lib/utils';

interface ProjectTimelineProps {
  features: ProjectFeature[];
  recentSessions?: SessionLog[];
  onFeatureClick?: (feature: ProjectFeature) => void;
  className?: string;
}

export default function ProjectTimeline({ 
  features, 
  recentSessions = [],
  onFeatureClick,
  className 
}: ProjectTimelineProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Group features by category
  const categories = Array.from(new Set(features.map(f => f.category)));
  
  // Filter features based on selected filters
  const filteredFeatures = features.filter(feature => {
    const categoryMatch = selectedCategory === 'all' || feature.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || feature.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  // Sort features by priority and status
  const sortedFeatures = filteredFeatures.sort((a, b) => {
    // Completed items go to bottom
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;
    
    // Then by priority
    return b.priority - a.priority;
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
          >
            All Status
          </Button>
          {['planned', 'in-progress', 'completed', 'blocked'].map(status => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline backbone */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-zinc-500 via-purple-500 to-green-500 opacity-30" />
        
        {/* Feature nodes */}
        <div className="space-y-6">
          {sortedFeatures.map((feature, index) => (
            <TimelineFeatureNode
              key={feature.id}
              feature={feature}
              position={index}
              recentActivity={getRecentActivityForFeature(feature.feature_key, recentSessions)}
              onClick={() => onFeatureClick?.(feature)}
            />
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <StatCard
          title="Total Features"
          value={features.length}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          title="Completed"
          value={features.filter(f => f.status === 'completed').length}
          icon={<CheckCircle className="h-4 w-4 text-zinc-500" />}
        />
        <StatCard
          title="In Progress"
          value={features.filter(f => f.status === 'in-progress').length}
          icon={<Circle className="h-4 w-4 text-zinc-500" />}
        />
        <StatCard
          title="Blocked"
          value={features.filter(f => f.status === 'blocked').length}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        />
      </div>
    </div>
  );
}

interface TimelineFeatureNodeProps {
  feature: ProjectFeature;
  position: number;
  recentActivity: SessionLog[];
  onClick: () => void;
}

function TimelineFeatureNode({ feature, position, recentActivity, onClick }: TimelineFeatureNodeProps) {
  const statusConfig = {
    planned: { color: 'bg-gray-100 border-gray-300', icon: Circle, iconColor: 'text-gray-400' },
    'in-progress': { color: 'bg-zinc-100 border-zinc-300', icon: Circle, iconColor: 'text-zinc-500' },
    completed: { color: 'bg-zinc-100 border-green-300', icon: CheckCircle, iconColor: 'text-zinc-500' },
    deferred: { color: 'bg-zinc-100 border-yellow-300', icon: Pause, iconColor: 'text-yellow-500' },
    blocked: { color: 'bg-zinc-100 border-red-300', icon: AlertTriangle, iconColor: 'text-red-500' }
  };

  const config = statusConfig[feature.status];
  const StatusIcon = config.icon;

  return (
    <div className="relative flex items-start group">
      {/* Timeline node */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "w-16 h-16 rounded-full border-4 flex items-center justify-center relative z-10 cursor-pointer transition-all duration-200 hover:scale-110",
                config.color,
                "bg-white shadow-lg"
              )}
              onClick={onClick}
            >
              <div className="relative">
                <StatusIcon className={cn("h-6 w-6", config.iconColor)} />
                {/* Progress ring */}
                <svg className="absolute inset-0 w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-200"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - feature.completion_percentage / 100)}`}
                    className={config.iconColor}
                  />
                </svg>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{feature.completion_percentage.toFixed(0)}% complete</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Feature card */}
      <Card 
        className="ml-6 flex-1 cursor-pointer transition-all duration-200 hover:shadow-lg group-hover:border-zinc-500/50"
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <p className="text-sm text-zinc-400 mt-1">{feature.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(feature.status)}>
                {feature.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Priority: {feature.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Description */}
          {feature.description && (
            <p className="text-sm text-zinc-400">{feature.description}</p>
          )}
          
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{feature.completion_percentage.toFixed(0)}%</span>
            </div>
            <Progress value={feature.completion_percentage} className="h-2" />
          </div>
          
          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{feature.estimated_hours}h estimated</span>
            </div>
            {recentActivity.length > 0 && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Last activity: {new Date(recentActivity[0].session_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          {/* Dependencies */}
          {feature.dependencies.length > 0 && (
            <div className="text-xs">
              <span className="text-zinc-400">Depends on: </span>
              <span className="text-zinc-500">{feature.dependencies.join(', ')}</span>
            </div>
          )}
          
          {/* Recent activity indicator */}
          {recentActivity.length > 0 && (
            <div className="text-xs text-zinc-600 bg-zinc-50 rounded px-2 py-1">
              {recentActivity.length} recent session{recentActivity.length > 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in-progress':
      return 'secondary';
    case 'blocked':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getRecentActivityForFeature(featureKey: string, sessions: SessionLog[]): SessionLog[] {
  return sessions.filter(session => 
    session.features_worked_on.includes(featureKey)
  ).slice(0, 3); // Get last 3 sessions
}