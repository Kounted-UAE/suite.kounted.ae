"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/react-ui/dialog';
import { Badge } from '@/components/react-ui/badge';
import { Button } from '@/components/react-ui/button';
import { Progress } from '@/components/react-ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/react-ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/react-ui/card';
import { 
  Target, 
  Clock, 
  Calendar, 
  GitCommit, 
  MessageCircle, 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Edit
} from 'lucide-react';
import type { ProjectFeature, SessionLog, Milestone } from '@/lib/types/dev-progress';
import { cn } from '@/lib/utils';

interface FeatureDetailModalProps {
  feature: ProjectFeature | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (feature: ProjectFeature) => void;
}

export default function FeatureDetailModal({ 
  feature, 
  isOpen, 
  onClose, 
  onEdit 
}: FeatureDetailModalProps) {
  const [recentSessions, setRecentSessions] = useState<SessionLog[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (feature && isOpen) {
      fetchFeatureData();
    }
  }, [feature, isOpen]);

  const fetchFeatureData = async () => {
    if (!feature) return;
    
    setLoading(true);
    try {
      // Fetch recent sessions for this feature
      const sessionsResponse = await fetch(
        `/api/dev-progress/sessions?feature_key=${feature.feature_key}&limit=10`
      );
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setRecentSessions(sessionsData.sessions || []);
      }

      // Fetch milestones for this feature (when implemented)
      // const milestonesResponse = await fetch(`/api/dev-progress/milestones?feature_id=${feature.id}`);
      // if (milestonesResponse.ok) {
      //   const milestonesData = await milestonesResponse.json();
      //   setMilestones(milestonesData.milestones || []);
      // }
    } catch (error) {
      console.error('Error fetching feature data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!feature) return null;

  const statusConfig = {
    planned: { color: 'text-gray-500', bgColor: 'bg-gray-100' },
    'in-progress': { color: 'text-zinc-500', bgColor: 'bg-zinc-100' },
    completed: { color: 'text-zinc-500', bgColor: 'bg-zinc-100' },
    deferred: { color: 'text-yellow-500', bgColor: 'bg-zinc-100' },
    blocked: { color: 'text-red-500', bgColor: 'bg-zinc-100' }
  };

  const config = statusConfig[feature.status];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl">{feature.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{feature.category}</Badge>
                <Badge className={cn(config.color, config.bgColor)}>
                  {feature.status}
                </Badge>
                <Badge variant="outline">Priority: {feature.priority}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {feature.url_path && feature.url_path !== '#' && (
                <Button variant="outline" size="sm" asChild>
                  <a href={feature.url_path} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </a>
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(feature)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress overview */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{feature.completion_percentage.toFixed(0)}%</span>
            </div>
            <Progress value={feature.completion_percentage} className="h-3" />
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">Overview</TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">Sessions</TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center gap-2">Milestones</TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Description */}
            {feature.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Objectives */}
            {feature.objectives && feature.objectives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span>Estimated: {feature.estimated_hours} hours</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span>Created: {new Date(feature.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span>Updated: {new Date(feature.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Dependencies */}
              {feature.dependencies && feature.dependencies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dependencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {feature.dependencies.map((dep, index) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-zinc-400">
                Loading sessions...
              </div>
            ) : recentSessions.length > 0 ? (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <Card key={session.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {session.session_title || 'Development Session'}
                          </CardTitle>
                          <p className="text-sm text-zinc-400">
                            {new Date(session.session_date).toLocaleDateString()}
                          </p>
                        </div>
                        {session.ai_estimated_hours && (
                          <Badge variant="outline">
                            {session.ai_estimated_hours}h
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{session.summary_text}</p>
                      
                      {session.key_achievements && session.key_achievements.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Key Achievements:</p>
                          <ul className="text-xs space-y-1">
                            {session.key_achievements.map((achievement, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <CheckCircle className="h-3 w-3 text-zinc-500 mt-0.5" />
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {session.blockers_identified && session.blockers_identified.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Blockers:</p>
                          <ul className="text-xs space-y-1">
                            {session.blockers_identified.map((blocker, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5" />
                                <span>{blocker}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sessions recorded for this feature yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <div className="text-center py-8 text-zinc-400">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Milestone tracking coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Sessions:</span>
                    <span className="font-medium">{recentSessions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Estimated Hours:</span>
                    <span className="font-medium">
                      {recentSessions.reduce((sum, s) => sum + (s.ai_estimated_hours || 0), 0).toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Activity:</span>
                    <span className="font-medium">
                      {recentSessions.length > 0 
                        ? new Date(recentSessions[0].session_date).toLocaleDateString()
                        : 'None'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progress Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Completion:</span>
                    <span className="font-medium">{feature.completion_percentage.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Remaining:</span>
                    <span className="font-medium">
                      {(feature.estimated_hours * (1 - feature.completion_percentage / 100)).toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Priority Rank:</span>
                    <span className="font-medium">{feature.priority}/100</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}