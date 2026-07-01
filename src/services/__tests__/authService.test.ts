jest.mock('../../config/firebase', () => ({ auth: {} }));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { signUp, signIn, signOut, resetPassword, subscribeToAuthChanges, mapAuthError } from '../authService';

describe('authService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('signUp returns the created user on success', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: '1', email: 'a@b.com' } });

    const user = await signUp('a@b.com', 'Password1');

    expect(user).toEqual({ uid: '1', email: 'a@b.com' });
  });

  it('signUp maps a known Firebase error to a French message', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue({ code: 'auth/email-already-in-use' });

    await expect(signUp('a@b.com', 'Password1')).rejects.toThrow('Un compte existe déjà avec cette adresse email');
  });

  it('signIn maps invalid credentials to a French message', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({ code: 'auth/invalid-credential' });

    await expect(signIn('a@b.com', 'wrong')).rejects.toThrow('Email ou mot de passe incorrect');
  });

  it('signOut delegates to firebase signOut', async () => {
    (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

    await signOut();

    expect(firebaseSignOut).toHaveBeenCalled();
  });

  it('resetPassword maps unknown user to a French message', async () => {
    (sendPasswordResetEmail as jest.Mock).mockRejectedValue({ code: 'auth/user-not-found' });

    await expect(resetPassword('missing@b.com')).rejects.toThrow('Aucun compte ne correspond à cette adresse email');
  });

  it('subscribeToAuthChanges registers and returns an unsubscribe function', () => {
    const unsubscribe = jest.fn();
    (onAuthStateChanged as jest.Mock).mockReturnValue(unsubscribe);

    const result = subscribeToAuthChanges(() => {});

    expect(result).toBe(unsubscribe);
  });

  it('mapAuthError falls back to a generic message for unknown codes', () => {
    expect(mapAuthError({ code: 'auth/unknown' })).toBe('Une erreur est survenue, veuillez réessayer');
  });
});
