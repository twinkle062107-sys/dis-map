export type TurnDirection = 'left' | 'right' | 'straight' | 'start' | 'arrive';

export interface RouteStep {
  id: string;
  landmarkName: string;
  colorName: string;
  colorHex: string;
  colorBgHex: string;
  colorBorderHex: string;
  iconName: string;
  turn: TurnDirection;
  turnText: string;
  text: string; // Max 8 words
  subText: string;
  photoPlaceholder: string;
  timeAgoLabel: string;
  detailHint: string;
  coordinates: [number, number]; // [lat, lng]
  emoji: string;
}

export interface SafeHaven {
  id: string;
  name: string;
  type: 'pharmacy' | 'bank' | 'police' | 'clinic';
  landmarkDirection: string;
  colorName: string;
  colorHex: string;
  iconName: string;
  openHours: string;
  phone: string;
  distanceDescription: string; // No numeric meters/miles! e.g. "Just across the street"
  instruction: string;
  coordinates: [number, number];
}

export type SurfaceHazardType =
  | 'stairs'
  | 'ramp'
  | 'elevator'
  | 'uneven_cobblestones'
  | 'mud'
  | 'smooth_paved'
  | 'busy_curb_crossing'
  | 'pedestrian_crossing';

export interface SurfaceHazard {
  id: string;
  type: SurfaceHazardType;
  label: string;
  coordinates: [number, number];
  isVerified: boolean;
  severity: 'low' | 'warning' | 'barrier';
  reportedBy?: string;
  upvotes?: number;
}

export interface RadarLandmark {
  id: string;
  question: string;
  direction: 'left' | 'right' | 'straight' | 'behind';
  landmarkName: string;
  colorName: string;
  colorHex: string;
  iconName: string;
  stepIndex: number;
}

export interface CaregiverAlert {
  id: string;
  timestamp: string;
  type: 'off_route' | 'safe_haven' | 'sos' | 'progress' | 'destination_reached' | 're_anchored';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  landmarkContext: string;
  resolved: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredCount: number;
}

export interface CommunitySpotterEntry {
  id: string;
  landmarkName: string;
  colorName: string;
  colorHex: string;
  statusText: string;
  photoUrl: string;
  submittedBy: string;
  submittedAt: string;
  upvotes: number;
}
