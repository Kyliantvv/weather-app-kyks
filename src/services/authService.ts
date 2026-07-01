import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse email',
  'auth/invalid-email': "L'adresse email n'est pas valide",
  'auth/user-not-found': 'Aucun compte ne correspond à cette adresse email',
  'auth/wrong-password': 'Mot de passe incorrect',
  'auth/invalid-credential': 'Email ou mot de passe incorrect',
  'auth/weak-password': 'Le mot de passe est trop faible',
  'auth/network-request-failed': 'Problème de connexion réseau, veuillez réessayer',
  'auth/too-many-requests': 'Trop de tentatives, veuillez réessayer plus tard',
};

export function mapAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  return ERROR_MESSAGES[code] ?? 'Une erreur est survenue, veuillez réessayer';
}

export async function signUp(email: string, password: string): Promise<User> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
