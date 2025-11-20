import { Place, Venue, Boat } from './types';

export const PLACES_DATA: Place[] = [
  {
    id: '1',
    name: 'Bedri Rahmi Koyu',
    description: 'Ünlü ressam Bedri Rahmi Eyüboğlu\'nun kaya üzerine çizdiği balık resmi ile bilinir. Turkuaz suları ve zeytin ağaçlarıyla çevrilidir.',
    type: 'SEA',
    tags: ['Tarihi', 'Restoran Var', 'Popüler'],
    imageUrl: 'https://images.unsplash.com/photo-1605218427368-35b08d7d5749?q=80&w=800'
  },
  {
    id: '2',
    name: 'Yassıca Adaları',
    description: 'Sığ denizi ve kumsalı ile özellikle çocuklu aileler için idealdir. Küçük adacıklar arasında yüzmek keyiflidir.',
    type: 'SEA',
    tags: ['Aileye Uygun', 'Sığ Deniz', 'Fotoğraflık'],
    imageUrl: 'https://picsum.photos/id/11/400/300'
  },
  {
    id: '3',
    name: 'Göbün Koyu',
    description: 'İki yüksek tepenin arasında kalmış, rüzgar almayan sakin bir koy. Suyu oldukça berrak ve derindir.',
    type: 'SEA',
    tags: ['Sakin', 'Dalış', 'Zeytinlik'],
    imageUrl: 'https://picsum.photos/id/16/400/300'
  },
  {
    id: '4',
    name: 'Göcek Kordon',
    description: 'Marina boyunca uzanan, palmiye ağaçları altındaki yürüyüş yolu. Akşam yürüyüşleri için ideal.',
    type: 'LAND',
    tags: ['Yürüyüş', 'Merkez', 'Manzara'],
    imageUrl: 'https://picsum.photos/id/42/400/300'
  },
  {
    id: '5',
    name: 'İnlice Plajı',
    description: 'Göcek\'e en yakın halk plajlarından biridir. Koyu renkli kumu ve geniş alanı vardır.',
    type: 'LAND',
    tags: ['Plaj', 'Halk Plajı', 'Yakın'],
    imageUrl: 'https://picsum.photos/id/48/400/300'
  }
];

export const VENUES_DATA: Venue[] = [
  {
    id: '1',
    name: 'West Cafe',
    category: 'KAFE',
    description: 'Deniz kenarında kahvaltı ve kahve keyfi. Sakin atmosfer.',
    price: '₺₺',
    location: 'Merkez Marina',
    imageUrl: 'https://picsum.photos/id/225/400/300'
  },
  {
    id: '2',
    name: 'Özcan Restaurant',
    category: 'RESTORAN',
    description: 'Günlük taze deniz ürünleri ve Ege mezeleri.',
    price: '₺₺₺',
    location: 'Çarşı İçi',
    imageUrl: 'https://picsum.photos/id/431/400/300'
  },
  {
    id: '3',
    name: 'Q Lounge',
    category: 'BAR',
    description: 'Muhteşem gün batımı manzarası, kokteyller ve Japon mutfağı esintileri.',
    price: '₺₺₺',
    location: 'D-Resort',
    imageUrl: 'https://picsum.photos/id/342/400/300'
  },
  {
    id: '4',
    name: 'Limon Bar',
    category: 'PUB',
    description: 'Samimi ortam, canlı müzik ve geniş içecek menüsü.',
    price: '₺₺',
    location: 'Arka Sokak',
    imageUrl: 'https://picsum.photos/id/453/400/300'
  }
];

export const BOATS_DATA: Boat[] = [
  {
    id: '101',
    name: 'Mavi Rüya',
    type: 'Gulet',
    capacity: 8,
    length: 24,
    location: 'Göcek Merkez',
    price: 15000,
    currency: 'TL',
    imageUrl: 'https://picsum.photos/id/23/400/300',
    description: 'Geleneksel ahşap gulet, geniş güverte alanı.'
  },
  {
    id: '102',
    name: 'Wind Dancer',
    type: 'Yelkenli',
    capacity: 6,
    length: 14,
    location: 'D-Marin',
    price: 450,
    currency: 'EUR',
    imageUrl: 'https://picsum.photos/id/29/400/300',
    description: 'Modern yelkenli, sportif ve konforlu.'
  },
  {
    id: '103',
    name: 'Sea Star',
    type: 'Motor Yat',
    capacity: 10,
    length: 18,
    location: 'Club Marina',
    price: 2000,
    currency: 'EUR',
    imageUrl: 'https://picsum.photos/id/36/400/300',
    description: 'Hızlı ve lüks, günübirlik turlar için ideal.'
  }
];