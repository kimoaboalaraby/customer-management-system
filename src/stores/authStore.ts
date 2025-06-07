
import { create } from 'zustand';
import { User } from '../types';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Import Firebase auth and db instances

// Function to fetch user profile data from Firestore
const fetchUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDocRef = doc(db, 'users', uid); // Assuming 'users' collection stores profiles
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      // Combine Firebase UID with Firestore profile data
      return { id: uid, ...userDocSnap.data() } as User;
    } else {
      console.error("No user profile found in Firestore for UID:", uid);
      // Handle case where user exists in Auth but not Firestore (e.g., return basic info or error)
      return null; 
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

type AuthState = {
  user: User | null;
  firebaseUser: FirebaseUser | null; // Store the raw Firebase user object if needed
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeAuthListener: () => () => void; // Returns the unsubscribe function
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true, // Start as true until auth state is determined
  error: null,

  initializeAuthListener: () => {
    // Set up the listener for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        set({ isLoading: true, error: null });
        const userProfile = await fetchUserProfile(firebaseUser.uid);
        if (userProfile) {
          set({
            user: userProfile,
            firebaseUser: firebaseUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Handle case where profile fetch failed
          // Maybe sign out the user or set an error state
          await signOut(auth); // Sign out if profile is missing
          set({
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'فشل في تحميل ملف تعريف المستخدم.',
          });
        }
      } else {
        // User is signed out
        set({ user: null, firebaseUser: null, isAuthenticated: false, isLoading: false, error: null });
      }
    });
    // Return the unsubscribe function for cleanup
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will be handled by the listener (initializeAuthListener)
      // The listener will fetch the profile and update the state.
      // We don't need to set the state here directly after login.
      return true;
    } catch (error: any) {
      console.error("Firebase login error:", error);
      let errorMessage = 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';
      // Customize error messages based on Firebase error codes if needed
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'صيغة البريد الإلكتروني غير صحيحة.';
      }
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut(auth);
      // Auth state change will be handled by the listener
      // State will be cleared automatically by the listener
    } catch (error) {
      console.error("Firebase logout error:", error);
      set({ error: 'فشل تسجيل الخروج.', isLoading: false });
    }
  },
}));

// Initialize the auth listener when the store is created or app starts
// This needs to be called once, e.g., in your main App component.
// const unsubscribe = useAuthStore.getState().initializeAuthListener();
// Remember to call unsubscribe() when the app unmounts.

