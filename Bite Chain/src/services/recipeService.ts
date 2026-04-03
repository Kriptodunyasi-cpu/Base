import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  increment,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Recipe, Category, MediaType, Comment, Donation } from '../types';

export const recipeService = {
  async uploadMedia(file: File, userId: string): Promise<{ url: string; type: MediaType }> {
    const storageRef = ref(storage, `recipes/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    const type: MediaType = file.type.startsWith('video/') ? 'video' : 'image';
    return { url, type };
  },

  async createRecipe(recipeData: Omit<Recipe, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'recipes'), {
      ...recipeData,
      likesCount: 0,
      commentsCount: 0,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  async getRecipes(category?: Category, country?: string): Promise<Recipe[]> {
    let q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'), limit(20));
    
    if (category) {
      q = query(q, where('category', '==', category));
    }
    if (country) {
      q = query(q, where('country', '==', country));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
  },

  subscribeToRecipes(callback: (recipes: Recipe[]) => void, category?: Category) {
    let q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    if (category) {
      q = query(q, where('category', '==', category));
    }
    return onSnapshot(q, (snapshot) => {
      const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      callback(recipes);
    });
  },

  async getRecipeById(id: string): Promise<Recipe | null> {
    const docRef = doc(db, 'recipes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Recipe;
    }
    return null;
  },

  async likeRecipe(recipeId: string, userId: string) {
    const likeId = `${userId}_${recipeId}`;
    const likeRef = doc(db, 'likes', likeId);
    const likeSnap = await getDoc(likeRef);

    if (!likeSnap.exists()) {
      await addDoc(collection(db, 'likes'), { userId, recipeId, createdAt: Timestamp.now() });
      await updateDoc(doc(db, 'recipes', recipeId), {
        likesCount: increment(1)
      });
    }
  },

  async addComment(recipeId: string, userId: string, userName: string, text: string) {
    await addDoc(collection(db, `recipes/${recipeId}/comments`), {
      recipeId,
      userId,
      userName,
      text,
      createdAt: Timestamp.now()
    });
    await updateDoc(doc(db, 'recipes', recipeId), {
      commentsCount: increment(1)
    });
  },

  subscribeToComments(recipeId: string, callback: (comments: Comment[]) => void) {
    const q = query(collection(db, `recipes/${recipeId}/comments`), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      callback(comments);
    });
  },

  async sendDonation(recipeId: string, fromUserId: string, toUserId: string, amount: number) {
    await addDoc(collection(db, 'donations'), {
      recipeId,
      fromUserId,
      toUserId,
      amount,
      createdAt: Timestamp.now()
    });
    // Update recipient's total earnings
    await updateDoc(doc(db, 'users', toUserId), {
      totalEarnings: increment(amount)
    });
  },

  async deleteRecipe(recipeId: string) {
    await deleteDoc(doc(db, 'recipes', recipeId));
  },

  async updateRecipe(recipeId: string, data: Partial<Recipe>) {
    const docRef = doc(db, 'recipes', recipeId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  }
};
