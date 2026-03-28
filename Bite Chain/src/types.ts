import { Timestamp } from 'firebase/firestore';

export type Category = 'food' | 'dessert' | 'drink' | 'salad';
export type MediaType = 'image' | 'video';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  country?: string;
  walletAddress?: string;
  totalEarnings?: number;
}

export interface Recipe {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description?: string;
  category: Category;
  country?: string;
  ingredients: string[];
  steps: string[];
  mediaUrl: string;
  mediaType: MediaType;
  likesCount: number;
  commentsCount: number;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Timestamp;
}

export interface Donation {
  id: string;
  recipeId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  txHash?: string;
  createdAt: Timestamp;
}
