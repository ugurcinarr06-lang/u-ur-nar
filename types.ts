export type ViewState = 'HOME' | 'ABOUT' | 'PLACES' | 'DINING' | 'BOAT_RENTAL' | 'SEA_ORDER';

export interface Place {
  id: string;
  name: string;
  description: string;
  type: 'SEA' | 'LAND';
  tags?: string[];
  imageUrl: string;
}

export interface Venue {
  id: string;
  name: string;
  category: 'KAFE' | 'BAR' | 'RESTORAN' | 'PUB';
  description: string;
  price: '₺' | '₺₺' | '₺₺₺';
  location: string;
  imageUrl: string;
}

export interface Boat {
  id: string;
  name: string;
  type: string;
  capacity: number;
  length: number;
  location: string;
  price: number;
  currency: 'TL' | 'EUR';
  imageUrl: string;
  description: string;
}

export interface Order {
  boatName: string;
  location: string;
  phone: string;
  needs: string;
  timestamp: Date;
}