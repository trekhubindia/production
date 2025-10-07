'use client';

import React, { useState } from 'react';
import { TrekRoute, RouteVisualizationProps, Waypoint } from '@/lib/types/waypoint-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mountain, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Clock, 
  Ruler,
  BarChart3,
  Route,
  Navigation
} from 'lucide-react';

const RouteVisualization: React.FC<RouteVisualizationProps> = ({
  route,
  selectedWaypoint,
  showElevationProfile = true,
  showStatistics = true
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate additional statistics
  const totalWaypoints = route.waypoints.length;
  const waypointTypes = route.waypoints.reduce((acc, wp) => {
    acc[wp.waypoint_type] = (acc[wp.waypoint_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const difficultyDistribution = route.waypoints.reduce((acc, wp) => {
    if (wp.difficulty_level) {
      acc[wp.difficulty_level] = (acc[wp.difficulty_level] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Elevation profile component
  const ElevationProfile = () => {
    if (!route.elevation_profile || route.elevation_profile.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No elevation data available</p>
          </div>
        </div>
      );
    }

    const maxElevation = Math.max(...route.elevation_profile.map(p => p.elevation));
    const minElevation = Math.min(...route.elevation_profile.map(p => p.elevation));
    const maxDistance = Math.max(...route.elevation_profile.map(p => p.distance));

    return (
      <div className="h-64 relative">
        <svg width="100%" height="100%" viewBox="0 0 800 200" className="border rounded-lg bg-gradient-to-b from-sky-50 to-green-50 dark:from-sky-900/20 dark:to-green-900/20">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Elevation line */}
          <polyline
            points={route.elevation_profile.map((point, index) => {
              const x = (point.distance / maxDistance) * 760 + 20;
              const y = 180 - ((point.elevation - minElevation) / (maxElevation - minElevation)) * 160;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            className="drop-shadow-sm"
          />
          
          {/* Fill area under curve */}
          <polygon
            points={`20,180 ${route.elevation_profile.map((point, index) => {
              const x = (point.distance / maxDistance) * 760 + 20;
              const y = 180 - ((point.elevation - minElevation) / (maxElevation - minElevation)) * 160;
              return `${x},${y}`;
            }).join(' ')} ${(maxDistance / maxDistance) * 760 + 20},180`}
            fill="url(#elevationGradient)"
            opacity="0.3"
          />
          
          <defs>
            <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Waypoint markers */}
          {route.elevation_profile.filter(p => p.waypoint_id).map((point, index) => {
            const waypoint = route.waypoints.find(wp => wp.id === point.waypoint_id);
            if (!waypoint) return null;
            
            const x = (point.distance / maxDistance) * 760 + 20;
            const y = 180 - ((point.elevation - minElevation) / (maxElevation - minElevation)) * 160;
            const isSelected = selectedWaypoint?.id === waypoint.id;
            
            return (
              <g key={point.waypoint_id}>
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? "#ef4444" : "#ffffff"}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
                >
                  {waypoint.day_number}
                </text>
              </g>
            );
          })}
          
          {/* Axis labels */}
          <text x="400" y="195" textAnchor="middle" className="text-xs fill-gray-600 dark:fill-gray-400">
            Distance (km)
          </text>
          <text x="10" y="100" textAnchor="middle" className="text-xs fill-gray-600 dark:fill-gray-400" transform="rotate(-90 10 100)">
            Elevation (m)
          </text>
        </svg>
        
        {/* Elevation stats overlay */}
        <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 text-xs">
          <div>Max: {maxElevation}m</div>
          <div>Min: {minElevation}m</div>
          <div>Range: {maxElevation - minElevation}m</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Route Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                {route.trek_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {totalWaypoints} waypoints • {route.total_duration}
              </p>
            </div>
            <Badge variant="outline" className="bg-primary/10">
              {route.trek_slug}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="elevation">Elevation</TabsTrigger>
          <TabsTrigger value="waypoints">Waypoints</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {showStatistics && route.route_statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Total Ascent</div>
                      <div className="text-lg font-bold">{route.route_statistics.total_ascent}m</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Total Descent</div>
                      <div className="text-lg font-bold">{route.route_statistics.total_descent}m</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Mountain className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Highest Point</div>
                      <div className="text-lg font-bold">{route.route_statistics.highest_point}m</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Avg Daily Distance</div>
                      <div className="text-lg font-bold">{route.route_statistics.average_daily_distance.toFixed(1)}km</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Waypoint Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Waypoint Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(waypointTypes).map(([type, count]) => (
                  <div key={type} className="text-center">
                    <div className="text-2xl font-bold text-primary">{count}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {type.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Distribution */}
          {Object.keys(difficultyDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Difficulty Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(difficultyDistribution).map(([difficulty, count]) => (
                    <Badge 
                      key={difficulty} 
                      variant="outline" 
                      className={`
                        ${difficulty === 'easy' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                        ${difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                        ${difficulty === 'difficult' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
                        ${difficulty === 'extreme' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                      `}
                    >
                      {difficulty}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Elevation Tab */}
        <TabsContent value="elevation" className="space-y-4">
          {showElevationProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Elevation Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ElevationProfile />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Waypoints Tab */}
        <TabsContent value="waypoints" className="space-y-4">
          <div className="grid gap-4">
            {route.waypoints.map((waypoint, index) => (
              <Card 
                key={waypoint.id}
                className={`transition-all duration-200 ${
                  selectedWaypoint?.id === waypoint.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:shadow-md'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {waypoint.day_number}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{waypoint.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {waypoint.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Mountain className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{waypoint.altitude}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Ruler className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{waypoint.distance}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-mono">
                              {waypoint.coordinates.lat.toFixed(4)}, {waypoint.coordinates.lng.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant="outline" className="capitalize">
                        {waypoint.waypoint_type.replace('_', ' ')}
                      </Badge>
                      {waypoint.difficulty_level && (
                        <Badge 
                          variant="outline"
                          className={`
                            ${waypoint.difficulty_level === 'easy' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                            ${waypoint.difficulty_level === 'moderate' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                            ${waypoint.difficulty_level === 'difficult' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
                            ${waypoint.difficulty_level === 'extreme' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                          `}
                        >
                          {waypoint.difficulty_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RouteVisualization;
