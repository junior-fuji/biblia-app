import React, { useMemo } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, {
  Circle,
  G,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

const abrahamBaseImage = require('../../../assets/atlas/abraham-base.png');
const exodusBaseImage = require('../../../assets/atlas/exodus-base.png');

const atlasBaseImages = {
  'abraham-journey': abrahamBaseImage,
  'exodus-journey': exodusBaseImage,
} as const;

type AtlasMapMarker = {
  id: string;
  title: string;
  x: number;
  y: number;
};

type AtlasMapRoute = {
  id: string;
  title: string;
  color: string;
  points: { x: number; y: number }[];
};

type Props = {
  imageKey?: string;
  markers: AtlasMapMarker[];
  routes: AtlasMapRoute[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (id: string) => void;
};

function shortTitle(title: string) {
  return title.replace('Ur dos Caldeus', 'Ur');
}

function buildPath(points: { x: number; y: number }[]) {
  if (!points.length) return '';

  const [first, ...rest] = points;

  return `M ${first.x},${first.y} ${rest
    .map((point) => `L ${point.x},${point.y}`)
    .join(' ')}`;
}

export default function AbrahamJourneyMap({
  imageKey,
  markers,
  routes,
  selectedMarkerId,
  onSelectMarker,
}: Props) {
  const mainRoute = routes[0];

  const selectedImageKey =
    imageKey ??
    (markers.some((marker) =>
      [
        'egypt-exodus',
        'ramesses',
        'succoth',
        'etham',
        'red-sea',
        'marah',
        'elim',
        'rephidim',
        'sinai',
        'kadesh-barnea',
        'mount-hor',
        'moab',
      ].includes(marker.id),
    )
      ? 'exodus-journey'
      : 'abraham-journey');

  const baseImageSource =
    atlasBaseImages[selectedImageKey as keyof typeof atlasBaseImages] ?? abrahamBaseImage;

  const routePath = useMemo(() => {
    return mainRoute ? buildPath(mainRoute.points) : '';
  }, [mainRoute]);

  return (
    <View style={styles.wrap}>
      <ImageBackground
        source={baseImageSource}
        resizeMode="contain"
        style={styles.baseImage}
        imageStyle={styles.baseImageInner}
      >
        <Svg viewBox="0 0 100 100" width="100%" height="100%" opacity={0}>
          {/* Overlay leve: rota e pontos continuam controlados pelo app */}
          {routePath ? (
            <>
              <Path
                d={routePath}
                stroke="#4B2F12"
                strokeWidth="4.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.26"
              />
              <Path
                d={routePath}
                stroke="#F2A900"
                strokeWidth="2.65"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d={routePath}
                stroke="#FFF2C2"
                strokeWidth="0.85"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.95"
              />
            </>
          ) : null}

          {markers.map((marker, index) => {
            const active = marker.id === selectedMarkerId;
            const label = shortTitle(marker.title);

            const labelPositions: Record<
              string,
              {
                x: number;
                y: number;
                anchor: 'start' | 'end';
                width: number;
              }
            > = {
              ur: { x: 67.2, y: 75.5, anchor: 'start', width: 22 },
              haran: { x: 59.5, y: 26.2, anchor: 'start', width: 13 },
              shechem: { x: 27.5, y: 46.5, anchor: 'end', width: 15 },
              bethel: { x: 27.8, y: 53.8, anchor: 'end', width: 13 },
              moriah: { x: 51.8, y: 57.7, anchor: 'start', width: 14 },
              hebron: { x: 27.3, y: 63.9, anchor: 'end', width: 15 },
              negev: { x: 50.5, y: 69.9, anchor: 'start', width: 17 },
              egypt: { x: 9.6, y: 75.2, anchor: 'start', width: 14 },
            };

            const placement = labelPositions[marker.id] ?? {
              x: marker.x + 5,
              y: marker.y + 1,
              anchor: 'start' as const,
              width: Math.min(label.length * 1.8 + 3, 20),
            };

            const rectX =
              placement.anchor === 'end'
                ? placement.x - placement.width
                : placement.x - 1.5;

            const textX =
              placement.anchor === 'end' ? placement.x - 1.6 : placement.x;

            return (
              <G key={marker.id}>
                <Path
                  d={`M ${marker.x},${marker.y} L ${textX},${placement.y}`}
                  stroke="#111827"
                  strokeWidth="0.55"
                  strokeLinecap="round"
                  opacity="0.45"
                  fill="none"
                />

                <Circle
                  cx={marker.x}
                  cy={marker.y}
                  r={active ? 3.9 : 3.2}
                  fill={active ? '#F2A900' : '#1F7EAF'}
                  stroke="#FFFFFF"
                  strokeWidth="0.95"
                />

                <Circle
                  cx={marker.x}
                  cy={marker.y}
                  r={active ? 6.4 : 5.1}
                  fill={active ? '#F2A900' : '#1F7EAF'}
                  opacity={active ? 0.28 : 0.18}
                />

                <SvgText
                  x={marker.x}
                  y={marker.y + 1.05}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="2.55"
                  fontWeight="900"
                >
                  {index + 1}
                </SvgText>

                <Rect
                  x={rectX}
                  y={placement.y - 3.9}
                  width={placement.width}
                  height="6"
                  rx="1.5"
                  fill="#111827"
                  opacity={active ? 0.92 : 0.8}
                />

                <SvgText
                  x={textX}
                  y={placement.y + 0.25}
                  textAnchor={placement.anchor}
                  fill="#FFFFFF"
                  fontSize="2.15"
                  fontWeight="800"
                >
                  {label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ImageBackground>

      <View style={styles.touchLayer}>
        {markers.map((marker) => (
          <TouchableOpacity
            key={marker.id}
            activeOpacity={0.7}
            onPress={() => onSelectMarker?.(marker.id)}
            style={[
              styles.touchMarker,
              {
                left: `${marker.x}%`,
                top: `${marker.y}%`,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendLine} />
        <Text style={styles.legendText}>Dourado: jornada • Azul: Egito</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  baseImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1DFC0',
  },

  baseImageInner: {
    width: '100%',
    height: '100%',
  },

  wrap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#F1DFC0',
    overflow: 'hidden',
  },

  touchLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  touchMarker: {
    position: 'absolute',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: 22,
  },

  legend: {
    display: 'none',
    position: 'absolute',
    left: 14,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  legendLine: {
    width: 28,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#C6922E',
    marginRight: 8,
  },

  legendText: {
    color: '#6B4E2E',
    fontSize: 11,
    fontWeight: '900',
  },
});
