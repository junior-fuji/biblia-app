import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G,
    LinearGradient,
    Path,
    Polygon,
    RadialGradient,
    Rect,
    Stop,
    Text as SvgText,
} from 'react-native-svg';

type Marker = {
  id: string;
  title: string;
  x: number;
  y: number;
};

type Props = {
  selectedMarkerId?: string | null;
  onSelectMarker?: (id: string) => void;
};

const markers: Marker[] = [
  { id: 'ur', title: 'Ur', x: 78, y: 70 },
  { id: 'haran', title: 'Harã', x: 55, y: 28 },
  { id: 'shechem', title: 'Siquém', x: 37, y: 49 },
  { id: 'bethel', title: 'Betel', x: 38, y: 54 },
  { id: 'negev', title: 'Neguebe', x: 39, y: 67 },
  { id: 'egypt', title: 'Egito', x: 18, y: 78 },
  { id: 'hebron', title: 'Hebrom', x: 37, y: 62 },
  { id: 'moriah', title: 'Moriá', x: 38, y: 58 },
];

function p(x: number, y: number) {
  return `${x},${y}`;
}

export default function AbrahamJourneyMap({
  selectedMarkerId,
  onSelectMarker,
}: Props) {
  const routePath = useMemo(() => {
    const route = [
      p(78, 70),
      p(68, 54),
      p(55, 28),
      p(47, 38),
      p(37, 49),
      p(38, 54),
      p(39, 67),
      p(18, 78),
      p(39, 67),
      p(37, 62),
      p(38, 58),
    ];

    return `M ${route.join(' L ')}`;
  }, []);

  return (
    <View style={styles.wrap}>
      <Svg viewBox="0 0 100 100" width="100%" height="100%">
        <Defs>
          <LinearGradient id="landGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F7E7C7" />
            <Stop offset="0.45" stopColor="#E8D2A8" />
            <Stop offset="1" stopColor="#D8B77D" />
          </LinearGradient>

          <LinearGradient id="waterGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#B9DCE9" />
            <Stop offset="1" stopColor="#83B8CE" />
          </LinearGradient>

          <RadialGradient id="desertGradient" cx="50%" cy="55%" r="65%">
            <Stop offset="0" stopColor="#F3D99D" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#D8AA60" stopOpacity="0.35" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100" height="100" fill="#F1DFC0" />

        {/* Água */}
        <Path
          d="M0,0 L0,100 L24,100 C18,88 15,77 18,63 C20,51 22,40 18,28 C15,18 9,8 0,0 Z"
          fill="url(#waterGradient)"
        />
        <Path
          d="M29,46 C32,42 35,42 37,47 C39,52 37,58 34,62 C31,59 30,53 29,46 Z"
          fill="#91C5D7"
          opacity="0.9"
        />
        <Path
          d="M36,48 C39,45 42,46 43,51 C44,56 42,62 39,67 C36,63 35,56 36,48 Z"
          fill="#77AFC6"
          opacity="0.75"
        />

        {/* Terras principais */}
        <Path
          d="M20,6 C32,3 47,7 62,13 C77,19 91,28 96,43 C101,60 92,79 77,90 C61,101 39,99 26,87 C14,76 14,56 18,41 C21,28 12,16 20,6 Z"
          fill="url(#landGradient)"
        />

        {/* Desertos */}
        <Ellipse
          cx="55"
          cy="71"
          rx="34"
          ry="21"
          fill="url(#desertGradient)"
          opacity="0.75"
        />
        <Ellipse cx="34" cy="76" rx="19" ry="13" fill="#E9C47D" opacity="0.45" />

        {/* Relevo / montanhas simplificadas */}
        <G opacity="0.58">
          <Path
            d="M31,42 C35,35 39,31 44,25 C48,32 52,37 55,45 C49,43 44,41 39,43 C36,44 33,44 31,42 Z"
            fill="#B88C55"
          />
          <Path
            d="M34,45 C38,38 42,35 45,29 C49,36 52,41 54,48 C49,46 44,44 40,46 C37,47 35,47 34,45 Z"
            fill="#8F683E"
            opacity="0.35"
          />

          <Path
            d="M40,52 C43,47 46,44 49,39 C52,45 56,51 58,58 C52,55 47,54 43,57 C41,56 40,54 40,52 Z"
            fill="#A77C49"
          />
          <Path
            d="M42,58 C45,53 48,50 51,45 C54,51 58,57 60,64 C54,61 49,60 45,63 C43,62 42,60 42,58 Z"
            fill="#7A5A36"
            opacity="0.28"
          />

          <Path
            d="M64,35 C69,27 74,24 80,18 C84,27 89,34 92,44 C84,41 77,40 71,43 C68,42 65,39 64,35 Z"
            fill="#AD8150"
          />
          <Path
            d="M63,66 C68,60 73,57 78,51 C82,60 87,67 90,76 C82,73 76,72 70,75 C67,73 65,70 63,66 Z"
            fill="#A97D4D"
            opacity="0.55"
          />
        </G>

        {/* Vales / regiões */}
        <Path
          d="M34,41 C38,50 40,60 39,72"
          stroke="#7B5A34"
          strokeWidth="1.1"
          opacity="0.26"
          fill="none"
        />
        <Path
          d="M23,34 C34,31 45,31 57,35"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          opacity="0.18"
          fill="none"
        />

        {/* Rios */}
        <Path
          d="M64,16 C66,26 65,36 62,47 C59,56 59,64 62,75"
          stroke="#5EA8C6"
          strokeWidth="1.5"
          opacity="0.85"
          fill="none"
        />
        <Path
          d="M30,42 C33,49 34,57 33,66"
          stroke="#5EA8C6"
          strokeWidth="1.2"
          opacity="0.75"
          fill="none"
        />

        {/* Regiões */}
        <SvgText x="69" y="24" fill="#7C5A34" fontSize="3.2" fontWeight="700">
          MESOPOTÂMIA
        </SvgText>
        <SvgText x="49" y="34" fill="#7C5A34" fontSize="3" fontWeight="700">
          HARÃ
        </SvgText>
        <SvgText x="31" y="45" fill="#7C5A34" fontSize="3" fontWeight="700">
          CANAÃ
        </SvgText>
        <SvgText x="43" y="77" fill="#8A6A3A" fontSize="3" fontWeight="700">
          DESERTO / NEGUEBE
        </SvgText>
        <SvgText x="10" y="84" fill="#2F6F87" fontSize="3.2" fontWeight="800">
          EGITO
        </SvgText>

        {/* Rota */}
        <Path
          d={routePath}
          stroke="#C6922E"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={routePath}
          stroke="#FFFFFF"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
          fill="none"
        />

        {/* Setas simples na rota */}
        <Polygon points="56,28 52.8,26.7 53.6,30" fill="#C6922E" />
        <Polygon points="38,50 35.5,47.6 34.9,51" fill="#C6922E" />
        <Polygon points="19,78 22.2,76.7 21.6,80" fill="#C6922E" />
        <Polygon points="38,59 40.8,57.2 40.4,60.8" fill="#C6922E" />

        {/* Marcadores */}
        {markers.map((marker) => {
          const active = marker.id === selectedMarkerId;

          return (
            <G key={marker.id}>
              <Circle
                cx={marker.x}
                cy={marker.y}
                r={active ? 2.6 : 2.1}
                fill={active ? '#D49A2A' : '#1F2937'}
                stroke="#FFFFFF"
                strokeWidth="0.8"
              />
              <Circle
                cx={marker.x}
                cy={marker.y}
                r={active ? 4.6 : 3.7}
                fill={active ? '#D49A2A' : '#1F2937'}
                opacity={active ? 0.18 : 0.1}
              />
              <SvgText
                x={marker.x + 2.8}
                y={marker.y - 1.8}
                fill="#1F2937"
                fontSize="2.6"
                fontWeight="800"
              >
                {marker.title}
              </SvgText>
            </G>
          );
        })}

        {/* Moldura */}
        <Rect
          x="1.2"
          y="1.2"
          width="97.6"
          height="97.6"
          rx="3.5"
          ry="3.5"
          fill="none"
          stroke="#C6922E"
          strokeWidth="0.5"
          opacity="0.55"
        />
      </Svg>

      <View style={styles.touchLayer}>
        {markers.map((marker) => (
          <TouchableOpacity
            key={marker.id}
            activeOpacity={0.75}
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
        <Text style={styles.legendText}>Rota principal da jornada</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: 36,
    height: 36,
    marginLeft: -18,
    marginTop: -18,
    borderRadius: 18,
  },

  legend: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  legendLine: {
    width: 24,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#C6922E',
    marginRight: 8,
  },

  legendText: {
    color: '#6B4E2E',
    fontSize: 11,
    fontWeight: '800',
  },
});