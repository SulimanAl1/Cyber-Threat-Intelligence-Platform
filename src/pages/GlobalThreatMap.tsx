import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Incident } from '../types/schemas';
import {
  Globe,
  Layers,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  Search,
  X,
  ChevronRight,
  Shield,
  MapPin,
  Table as TableIcon
} from 'lucide-react';
import * as d3Geo from 'd3-geo';

type LayerMode = 'all' | 'victim_only' | 'claimed_only';

interface CountryFeature {
  type: string;
  id?: string;
  properties: {
    name: string;
  };
  geometry: any;
}

export const GlobalThreatMap: React.FC = () => {
  const { incidents } = useData();
  const [geoData, setGeoData] = useState<{ features: CountryFeature[] } | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Map state
  const [layerMode, setLayerMode] = useState<LayerMode>('all');
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [unlocatedModalOpen, setUnlocatedModalOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  // Time scrubber state
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(100); // 0 to 100 percentage
  const playIntervalRef = useRef<number | null>(null);

  // Load offline GeoJSON basemap
  useEffect(() => {
    let isMounted = true;
    const fetchGeo = async () => {
      try {
        setGeoLoading(true);
        const baseUrl = import.meta.env.BASE_URL || '/';
        const url = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}data/world-110m.json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} loading offline basemap`);
        const data = await res.json();
        if (isMounted) {
          setGeoData(data);
          setGeoError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load world-110m.json:', err);
          setGeoError('Could not load offline vector basemap. Check network or bundle assets.');
        }
      } finally {
        if (isMounted) setGeoLoading(false);
      }
    };
    fetchGeo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute time bounds
  const { minDate, maxDate } = useMemo(() => {
    if (incidents.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: now };
    }
    const timestamps = incidents.map((i) => new Date(i.date).getTime()).filter((t) => !isNaN(t));
    const min = new Date(Math.min(...timestamps));
    const max = new Date(Math.max(...timestamps));

    return { minDate: min, maxDate: max };
  }, [incidents]);

  // Current cutoff date based on slider
  const currentDateCutoff = useMemo(() => {
    if (!minDate || !maxDate) return new Date();
    const range = maxDate.getTime() - minDate.getTime();
    return new Date(minDate.getTime() + (range * sliderIndex) / 100);
  }, [minDate, maxDate, sliderIndex]);

  // Handle Play/Pause
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        setSliderIndex((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 5;
        });
      }, 600);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying]);

  // Filter incidents by time slider
  const timeFilteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      const d = new Date(i.date).getTime();
      return isNaN(d) || d <= currentDateCutoff.getTime();
    });
  }, [incidents, currentDateCutoff]);

  // Separate located vs unlocated
  const { locatedIncidents, unlocatedIncidents } = useMemo(() => {
    const located: Incident[] = [];
    const unlocated: Incident[] = [];

    for (const inc of timeFilteredIncidents) {
      if (
        inc.victimLocation &&
        inc.victimLocation.countryCode !== 'UNKNOWN' &&
        inc.victimLocation.latitude &&
        inc.victimLocation.longitude
      ) {
        located.push(inc);
      } else {
        unlocated.push(inc);
      }
    }
    return { locatedIncidents: located, unlocatedIncidents: unlocated };
  }, [timeFilteredIncidents]);

  // Filter located incidents by active layer
  const displayedPins = useMemo(() => {
    return locatedIncidents.filter((inc) => {
      const isClaimed = inc.dataStatus === 'Claimed' || inc.sourceId === 'ransomware-live';
      if (layerMode === 'victim_only') return !isClaimed;
      if (layerMode === 'claimed_only') return isClaimed;
      return true;
    });
  }, [locatedIncidents, layerMode]);

  // Group located incidents by country for aggregate counts & table
  const countryAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        country: string;
        countryCode: string;
        count: number;
        confirmedCount: number;
        claimedCount: number;
        sectors: Set<string>;
        highestScore: number;
        incidents: Incident[];
      }
    >();

    for (const inc of locatedIncidents) {
      if (!inc.victimLocation) continue;
      const cName = inc.victimLocation.country;
      const cCode = inc.victimLocation.countryCode;
      const isClaim = inc.dataStatus === 'Claimed' || inc.sourceId === 'ransomware-live';

      if (!map.has(cName)) {
        map.set(cName, {
          country: cName,
          countryCode: cCode,
          count: 0,
          confirmedCount: 0,
          claimedCount: 0,
          sectors: new Set(),
          highestScore: 0,
          incidents: []
        });
      }
      const entry = map.get(cName)!;
      entry.count += 1;
      if (isClaim) entry.claimedCount += 1;
      else entry.confirmedCount += 1;
      if (inc.sector) entry.sectors.add(inc.sector);
      if (inc.priorityScore > entry.highestScore) entry.highestScore = inc.priorityScore;
      entry.incidents.push(inc);
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [locatedIncidents]);

  // D3 Projection and Path Generator
  const width = 960;
  const height = 480;

  const { projection, pathGenerator } = useMemo(() => {
    const proj = d3Geo
      .geoNaturalEarth1()
      .scale(155)
      .translate([width / 2, height / 2]);
    const pathGen = d3Geo.geoPath(proj);
    return { projection: proj, pathGenerator: pathGen };
  }, [width, height]);

  // Cluster pins that project close together (< 14px)
  const clusteredPins = useMemo(() => {
    interface MapMarker {
      x: number;
      y: number;
      country: string;
      incidents: Incident[];
      isOnlyClaimed: boolean;
      hasConfirmed: boolean;
    }

    const markers: MapMarker[] = [];
    const threshold = 14;

    for (const inc of displayedPins) {
      if (
        !inc.victimLocation ||
        inc.victimLocation.longitude === undefined ||
        inc.victimLocation.latitude === undefined
      ) {
        continue;
      }
      const coords = projection([inc.victimLocation.longitude, inc.victimLocation.latitude]);
      if (!coords) continue;
      const [x, y] = coords;

      const isClaim = inc.dataStatus === 'Claimed' || inc.sourceId === 'ransomware-live';

      // Find nearby marker
      const existing = markers.find((m) => {
        const dx = m.x - x;
        const dy = m.y - y;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
      });

      if (existing) {
        existing.incidents.push(inc);
        if (!isClaim) existing.isOnlyClaimed = false;
        if (inc.dataStatus === 'Confirmed') existing.hasConfirmed = true;
      } else {
        markers.push({
          x,
          y,
          country: inc.victimLocation.country,
          incidents: [inc],
          isOnlyClaimed: isClaim,
          hasConfirmed: inc.dataStatus === 'Confirmed'
        });
      }
    }

    return markers;
  }, [displayedPins, projection]);

  const activeCountryData = useMemo(() => {
    if (!selectedCountry) return null;
    return countryAggregates.find((c) => c.country.toLowerCase() === selectedCountry.toLowerCase());
  }, [selectedCountry, countryAggregates]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Global Threat & Victim Map
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            100% offline vector cartography showing verified victim locations and claimed extortion targets.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'map'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Vector Map</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Country Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Attribution & Scope Integrity Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-slate-300">
            <strong className="text-white">Strict Attribution Protocol:</strong> All map pins represent{' '}
            <span className="text-cyan-400 font-medium">victim or affected organization locations</span> only.{' '}
            Attacker origin is <span className="text-amber-400 font-semibold underline">never</span> implied or plotted.
          </div>
        </div>

        <button
          onClick={() => setUnlocatedModalOpen(true)}
          className="shrink-0 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {unlocatedIncidents.length} of {timeFilteredIncidents.length} unlocated
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Map Canvas Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Map Controls Bar */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Layer Toggles */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Layers:
                </span>
                <button
                  onClick={() => setLayerMode('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    layerMode === 'all'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({displayedPins.length})
                </button>
                <button
                  onClick={() => setLayerMode('victim_only')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    layerMode === 'victim_only'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Victims (Confirmed/Reported)
                </button>
                <button
                  onClick={() => setLayerMode('claimed_only')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    layerMode === 'claimed_only'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Claimed Extortion Targets
                </button>
              </div>

              {/* Map Legend */}
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/30 animate-pulse"></span>
                  <span>Confirmed/Reported Victim</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-500/30"></span>
                  <span>Attacker Extortion Claim</span>
                </div>
              </div>
            </div>

            {/* Offline Vector Map Viewport */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden aspect-[2/1] min-h-[380px] shadow-2xl flex items-center justify-center">
              {geoLoading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Loading offline vector basemap (world-110m.json)...</span>
                </div>
              ) : geoError ? (
                <div className="p-6 text-center text-rose-400 space-y-2">
                  <AlertTriangle className="w-8 h-8 mx-auto" />
                  <p className="text-sm font-semibold">{geoError}</p>
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-full select-none"
                  style={{ background: '#070b14' }}
                >
                  {/* Graticule grid lines for tactical look */}
                  <g className="opacity-15">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <line
                        key={`lat-${i}`}
                        x1="0"
                        y1={(i + 1) * (height / 10)}
                        x2={width}
                        y2={(i + 1) * (height / 10)}
                        stroke="#0ea5e9"
                        strokeDasharray="2 4"
                      />
                    ))}
                    {Array.from({ length: 19 }).map((_, i) => (
                      <line
                        key={`lon-${i}`}
                        x1={(i + 1) * (width / 20)}
                        y1="0"
                        x2={(i + 1) * (width / 20)}
                        y2={height}
                        stroke="#0ea5e9"
                        strokeDasharray="2 4"
                      />
                    ))}
                  </g>

                  {/* World Countries Geometry */}
                  <g>
                    {geoData?.features.map((feature, idx) => {
                      const d = pathGenerator(feature as any);
                      if (!d) return null;
                      const countryName = feature.properties?.name || '';
                      const isHovered = selectedCountry === countryName;
                      const hasIncidents = countryAggregates.some(
                        (c) => c.country.toLowerCase() === countryName.toLowerCase()
                      );

                      return (
                        <path
                          key={feature.id || idx}
                          d={d}
                          fill={
                            isHovered
                              ? '#1e293b'
                              : hasIncidents
                              ? '#0f172a'
                              : '#090d16'
                          }
                          stroke="#1e293b"
                          strokeWidth="0.75"
                          className="transition-colors duration-150 cursor-pointer hover:fill-slate-800"
                          onClick={() => {
                            if (hasIncidents) setSelectedCountry(countryName);
                          }}
                        >
                          <title>{countryName}</title>
                        </path>
                      );
                    })}
                  </g>

                  {/* Incident Marker Clusters */}
                  <g>
                    {clusteredPins.map((marker, idx) => {
                      const count = marker.incidents.length;
                      const isClaim = marker.isOnlyClaimed;
                      const radius = Math.min(18, Math.max(6, 5 + Math.log2(count) * 3));

                      return (
                        <g
                          key={idx}
                          transform={`translate(${marker.x}, ${marker.y})`}
                          className="cursor-pointer group"
                          onClick={() => {
                            setSelectedCountry(marker.country);
                            if (count === 1) setSelectedIncident(marker.incidents[0]);
                          }}
                        >
                          {/* Pulsing ring for confirmed victims */}
                          {marker.hasConfirmed && (
                            <circle
                              r={radius + 4}
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="1.5"
                              className="animate-ping opacity-35"
                            />
                          )}

                          {/* Marker base circle */}
                          <circle
                            r={radius}
                            fill={isClaim ? '#d97706' : '#0284c7'}
                            fillOpacity="0.85"
                            stroke={isClaim ? '#f59e0b' : '#38bdf8'}
                            strokeWidth="1.5"
                            className="group-hover:scale-125 transition-transform origin-center"
                          />

                          {/* Cluster count or dot */}
                          {count > 1 ? (
                            <text
                              textAnchor="middle"
                              dy=".3em"
                              fill="#ffffff"
                              fontSize={radius > 10 ? '9' : '8'}
                              fontWeight="bold"
                              className="select-none pointer-events-none font-mono"
                            >
                              {count}
                            </text>
                          ) : (
                            <circle
                              r="2"
                              fill="#ffffff"
                              className="pointer-events-none"
                            />
                          )}

                          <title>
                            {marker.country}: {count} {count === 1 ? 'incident' : 'incidents'}
                          </title>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}

              {/* Watermark notice */}
              <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono flex items-center gap-1.5 pointer-events-none">
                <span>Vector: Natural Earth 110m (Bundled Offline)</span>
                <span>•</span>
                <span>WGS84 Natural Earth Projection</span>
              </div>
            </div>

            {/* Time Scrubber / Timeline Playback */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 transition-colors"
                    title={isPlaying ? 'Pause Playback' : 'Play Timeline'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setSliderIndex(100);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Reset to latest"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-white">Timeline Scrubber</span>
                </div>

                <div className="text-xs text-slate-300 font-mono">
                  Showing incidents through:{' '}
                  <span className="text-cyan-400 font-bold">
                    {currentDateCutoff.toISOString().split('T')[0]}
                  </span>
                </div>
              </div>

              {/* Range slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderIndex}
                  onChange={(e) => setSliderIndex(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>{minDate ? minDate.toISOString().split('T')[0] : 'Start'}</span>
                  <span>Midpoint</span>
                  <span>{maxDate ? maxDate.toISOString().split('T')[0] : 'Current'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Inspection Drawer */}
          <div className="lg:col-span-1 space-y-4">
            {activeCountryData ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-white text-base">{activeCountryData.country}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Country Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">Total Incidents</div>
                    <div className="text-base font-bold text-white font-mono mt-0.5">
                      {activeCountryData.count}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">Peak Priority</div>
                    <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                      {activeCountryData.highestScore}/100
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Evidence Distribution
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Confirmed / Reported:</span>
                    <span className="font-mono text-cyan-400 font-medium">
                      {activeCountryData.confirmedCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Extortion Claims:</span>
                    <span className="font-mono text-amber-400 font-medium">
                      {activeCountryData.claimedCount}
                    </span>
                  </div>
                </div>

                {/* Country Incidents List */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Incidents in {activeCountryData.country}
                  </div>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {activeCountryData.incidents.map((inc) => (
                      <div
                        key={inc.id}
                        onClick={() => setSelectedIncident(inc)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          selectedIncident?.id === inc.id
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="font-medium line-clamp-2 leading-snug">{inc.title}</div>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                          <span>{inc.date.split('T')[0]}</span>
                          <span className="font-mono text-cyan-400">Score: {inc.priorityScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <MapPin className="w-8 h-8 mx-auto text-slate-600" />
                <div className="text-sm font-semibold text-white">Select a Country or Marker</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click any marker or country polygon on the map to inspect verified victim incidents,
                  attribution evidence, and sector impact.
                </p>
              </div>
            )}

            {/* Top Impacted Countries List */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Top Victim Countries</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {countryAggregates.length} Total
                </span>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {countryAggregates.slice(0, 8).map((c) => (
                  <button
                    key={c.country}
                    onClick={() => setSelectedCountry(c.country)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left ${
                      selectedCountry === c.country
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-white'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="truncate">{c.country}</span>
                    <span className="font-mono text-cyan-400 font-semibold shrink-0">
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Country-Level Incident Distribution (Accessible Table)
              </h2>
              <p className="text-xs text-slate-400">
                Full tabular breakdown of all verified victim locations for screen readers and keyboard navigation.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search countries..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
                <tr>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Total Incidents</th>
                  <th className="px-4 py-3">Confirmed / Reported</th>
                  <th className="px-4 py-3">Extortion Claims</th>
                  <th className="px-4 py-3">Affected Sectors</th>
                  <th className="px-4 py-3">Peak Priority</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {countryAggregates
                  .filter((c) =>
                    c.country.toLowerCase().includes(tableSearch.toLowerCase())
                  )
                  .map((c) => (
                    <tr key={c.country} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">{c.country}</td>
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">{c.count}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{c.confirmedCount}</td>
                      <td className="px-4 py-3 font-mono text-amber-400">{c.claimedCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Array.from(c.sectors).slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-rose-400">
                        {c.highestScore}/100
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedCountry(c.country);
                            setViewMode('map');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700"
                        >
                          View on Map
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Incident Modal Drawer */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  {selectedIncident.category}
                </span>
                <h3 className="text-base font-bold text-white mt-2 leading-snug">
                  {selectedIncident.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Geographic Attribution Evidence
              </div>
              <div className="text-slate-300">
                <span className="font-semibold text-white">Country:</span>{' '}
                {selectedIncident.victimLocation?.country} ({selectedIncident.victimLocation?.countryCode})
              </div>
              <div className="text-slate-400 italic bg-slate-900 p-2 rounded border border-slate-800">
                "{selectedIncident.victimLocation?.evidenceText}"
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
              {selectedIncident.summary}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <div className="font-mono text-cyan-400 font-bold">
                Priority: {selectedIncident.priorityScore}/100
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedIncident.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <span>Source URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`#/investigation?id=${selectedIncident.id}`}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
                >
                  Full Investigation
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unlocated Incidents Modal */}
      {unlocatedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Unlocated Incidents ({unlocatedIncidents.length})
                </h3>
              </div>
              <button
                onClick={() => setUnlocatedModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              These incidents have no verified geographic entity or country mention in their official
              bulletin. Under our Data Integrity Charter, they are{' '}
              <strong className="text-white">excluded from map coordinates</strong> to prevent
              speculative cartographic distortion.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {unlocatedIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">{inc.sourceId}</span>
                    <span>{inc.date.split('T')[0]}</span>
                  </div>
                  <div className="font-medium text-white">{inc.title}</div>
                  <div className="text-slate-400 line-clamp-2">{inc.summary}</div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setUnlocatedModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
