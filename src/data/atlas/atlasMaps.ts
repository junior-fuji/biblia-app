export type AtlasMarker = {
  id: string;
  title: string;
  subtitle?: string;
  x: number;
  y: number;
  description: string;
  references: string[];
};

export type AtlasRoutePoint = {
  x: number;
  y: number;
};

export type AtlasRoute = {
  id: string;
  title: string;
  color: string;
  points: AtlasRoutePoint[];
};

export type AtlasMap = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  period: string;
  summary: string;
  imageKey: string;
  references: string[];
  markers: AtlasMarker[];
  routes: AtlasRoute[];
};

export const atlasMaps: AtlasMap[] = [
  {
    id: 'abraham-journey',
    title: 'Jornada de Abraão',
    subtitle: 'De Ur dos Caldeus à terra de Canaã',
    category: 'Patriarcas',
    period: 'Período Patriarcal',
    imageKey: 'abraham-journey',
    summary:
      'A jornada de Abraão marca o início da história patriarcal. Chamado por Deus, Abrão sai da região da Mesopotâmia, passa por Harã e segue para Canaã, onde recebe a promessa da terra e da descendência. Em tempos de fome, desce ao Egito antes do nascimento de Isaque e depois retorna à região de Canaã, passando novamente pelo Neguebe e por Betel, estabelecendo-se depois em Hebrom. Moriá pertence a uma etapa posterior da história, já envolvendo Isaque.',
    references: [
      'Gênesis 11:27-32',
      'Gênesis 12:1-20',
      'Gênesis 13:1-18',
      'Gênesis 15:1-21',
      'Gênesis 17:1-27',
      'Gênesis 21:1-7',
      'Gênesis 22:1-19',
    ],
    markers: [
      {
        id: 'ur',
        title: 'Ur dos Caldeus',
        subtitle: 'Origem de Abrão',
        x: 78,
        y: 70,
        description:
          'Local associado à origem da família de Abrão antes da jornada em direção a Harã e Canaã.',
        references: ['Gênesis 11:28', 'Gênesis 11:31'],
      },
      {
        id: 'haran',
        title: 'Harã',
        subtitle: 'Parada antes de Canaã',
        x: 55,
        y: 28,
        description:
          'Região onde Terá, pai de Abrão, permaneceu. Depois da morte de Terá, Deus chama Abrão para seguir para a terra que lhe mostraria.',
        references: ['Gênesis 11:31-32', 'Gênesis 12:1-4'],
      },
      {
        id: 'shechem',
        title: 'Siquém',
        subtitle: 'Primeira parada em Canaã',
        x: 37,
        y: 49,
        description:
          'Lugar onde o Senhor apareceu a Abrão e prometeu dar aquela terra à sua descendência.',
        references: ['Gênesis 12:6-7'],
      },
      {
        id: 'bethel',
        title: 'Betel',
        subtitle: 'Altar ao Senhor',
        x: 38,
        y: 54,
        description:
          'Região onde Abrão armou sua tenda e edificou um altar ao Senhor. Depois de retornar do Egito, Abrão voltou para a região entre Betel e Ai.',
        references: ['Gênesis 12:8', 'Gênesis 13:3-4'],
      },
      {
        id: 'negev',
        title: 'Neguebe',
        subtitle: 'Região ao sul de Canaã',
        x: 39,
        y: 67,
        description:
          'Região árida ao sul de Canaã por onde Abrão passou em sua peregrinação. Dali ele desceu ao Egito por causa da fome e depois retornou.',
        references: ['Gênesis 12:9', 'Gênesis 13:1'],
      },
      {
        id: 'egypt',
        title: 'Egito',
        subtitle: 'Descida em tempo de fome',
        x: 18,
        y: 78,
        description:
          'Abrão desceu ao Egito por causa da fome na terra de Canaã. Esse episódio acontece antes do nascimento de Isaque e antes do episódio de Moriá.',
        references: ['Gênesis 12:10-20', 'Gênesis 13:1'],
      },
      {
        id: 'hebron',
        title: 'Hebrom',
        subtitle: 'Carvalhais de Manre',
        x: 37,
        y: 62,
        description:
          'Região onde Abrão habitou junto aos carvalhais de Manre e edificou altar ao Senhor, depois da separação entre Abrão e Ló.',
        references: ['Gênesis 13:18'],
      },
      {
        id: 'moriah',
        title: 'Moriá',
        subtitle: 'Provação de Abraão',
        x: 38,
        y: 58,
        description:
          'Região associada ao episódio em que Deus prova Abraão no sacrifício de Isaque. Esse acontecimento ocorre posteriormente, depois do nascimento de Isaque.',
        references: ['Gênesis 22:1-19'],
      },
    ],
    routes: [
      {
        id: 'main-route',
        title: 'Rota principal da jornada',
        color: '#C6922E',
        points: [
          { x: 78, y: 70 },
          { x: 68, y: 54 },
          { x: 55, y: 28 },
          { x: 47, y: 38 },
          { x: 37, y: 49 },
          { x: 38, y: 54 },
          { x: 39, y: 67 },
          { x: 18, y: 78 },
          { x: 39, y: 67 },
          { x: 38, y: 54 },
          { x: 37, y: 62 },
          { x: 38, y: 58 },
        ],
      },
    ],
  },
];

export function getAtlasMapById(id: string) {
  return atlasMaps.find((map) => map.id === id);
}