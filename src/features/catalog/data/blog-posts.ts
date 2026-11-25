export interface BlogPost {
  id: string;
  date: string;
  readingTime: string;
  title: string;
  excerpt: string;
  imageUrl: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 'post-1',
    date: '12 de setembro',
    readingTime: '6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    imageUrl: '/assets/nfts/artwork-08.webp',
  },
  {
    id: 'post-2',
    date: '13 de setembro',
    readingTime: '2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    imageUrl: '/assets/nfts/artwork-03.webp',
  },
  {
    id: 'post-3',
    date: '15 de setembro',
    readingTime: '3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    imageUrl: '/assets/nfts/artwork-04.webp',
  },
  {
    id: 'post-4',
    date: '15 de setembro',
    readingTime: '2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    imageUrl: '/assets/nfts/artwork-10.webp',
  },
];
