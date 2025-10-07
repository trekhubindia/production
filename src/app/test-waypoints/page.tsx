import React from 'react';
import TrekWaypoints from '@/components/TrekWaypoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Route, Mountain } from 'lucide-react';

export default function TestWaypointsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Trek Waypoints System</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Interactive waypoint visualization system for accurate trek route planning and navigation.
          Explore detailed waypoints, elevation profiles, and route statistics.
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            ✅ 77 Treks
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            📍 610 Waypoints
          </Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            🗺️ Interactive Maps
          </Badge>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Interactive Maps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Visualize trek routes with interactive waypoint markers, route lines, and detailed location information.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mountain className="h-5 w-5 text-green-600" />
              Elevation Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Detailed elevation charts showing altitude changes, ascent/descent statistics, and route difficulty analysis.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-purple-600" />
              Route Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Comprehensive waypoint details including facilities, safety notes, photo opportunities, and GPS coordinates.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sample Trek Waypoints */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Sample Trek: Everest Base Camp</h2>
          <p className="text-muted-foreground">
            Explore the detailed waypoint system with one of our most popular treks
          </p>
        </div>

        <TrekWaypoints 
          trekSlug="everest-base-camp-trek"
          trekName="Everest Base Camp Trek"
        />
      </div>

      {/* Alternative Treks */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">More Trek Examples</h2>
          <p className="text-muted-foreground">
            Try different treks to see how the waypoint system adapts to various routes
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Annapurna Base Camp Trek</h3>
            <TrekWaypoints 
              trekSlug="annapurna-base-camp-trek"
              trekName="Annapurna Base Camp Trek"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Adi Kailash & Om Parvat Trek</h3>
            <TrekWaypoints 
              trekSlug="adi-kailash-om-parvat-trek"
              trekName="Adi Kailash & Om Parvat Trek"
            />
          </div>
        </div>
      </div>

      {/* System Features */}
      <Card>
        <CardHeader>
          <CardTitle>Waypoint System Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">📍 Waypoint Types</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Start/End Points</li>
                <li>• Camp Sites & Base Camps</li>
                <li>• Viewpoints & Summits</li>
                <li>• Villages & Temples</li>
                <li>• Lakes, Glaciers & Passes</li>
                <li>• Rest Stops</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">📊 Route Analytics</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Elevation Profiles</li>
                <li>• Total Ascent/Descent</li>
                <li>• Difficulty Distribution</li>
                <li>• Distance Statistics</li>
                <li>• Waypoint Facilities</li>
                <li>• Safety Information</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Get Trek Waypoints</h4>
              <code className="text-sm bg-muted p-2 rounded block mt-1">
                GET /api/waypoints?trek_slug=everest-base-camp-trek&include_stats=true&include_elevation=true
              </code>
            </div>
            <div>
              <h4 className="font-semibold">Get Waypoint Statistics</h4>
              <code className="text-sm bg-muted p-2 rounded block mt-1">
                GET /api/waypoints/statistics?region=Nepal&waypoint_type=summit
              </code>
            </div>
            <div>
              <h4 className="font-semibold">Export Options</h4>
              <p className="text-sm text-muted-foreground">
                • GPX Export for GPS devices
                • JSON API for developers
                • Interactive sharing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
