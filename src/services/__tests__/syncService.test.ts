jest.mock('../../config/firebase', () => ({ auth: { currentUser: null } }));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('../db', () => ({
  getFavorites: jest.fn(),
  getHistory: jest.fn(),
  addFavorite: jest.fn(),
  addToHistory: jest.fn(),
}));

import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../../config/firebase';
import { getFavorites, getHistory, addFavorite, addToHistory } from '../db';
import { pushSyncSnapshot, pullSyncSnapshot, mergeFromCloud, syncNow } from '../syncService';

describe('syncService', () => {
  afterEach(() => {
    jest.clearAllMocks();
    (auth as any).currentUser = null;
  });

  describe('pushSyncSnapshot', () => {
    it('does nothing when no user is authenticated', async () => {
      await pushSyncSnapshot();

      expect(setDoc).not.toHaveBeenCalled();
    });

    it('writes local favorites and history to Firestore under the user uid', async () => {
      (auth as any).currentUser = { uid: 'user-1' };
      (getFavorites as jest.Mock).mockResolvedValue([{ id: 1, city: 'Paris', country: 'FR', addedAt: 'x' }]);
      (getHistory as jest.Mock).mockResolvedValue([{ id: 1, city: 'Paris', country: 'FR', searchedAt: 'y' }]);
      (doc as jest.Mock).mockReturnValue('doc-ref');

      await pushSyncSnapshot();

      expect(doc).toHaveBeenCalledWith(undefined, 'sync', 'user-1');
      expect(setDoc).toHaveBeenCalledWith('doc-ref', {
        favorites: [{ id: 1, city: 'Paris', country: 'FR', addedAt: 'x' }],
        history: [{ id: 1, city: 'Paris', country: 'FR', searchedAt: 'y' }],
      });
    });

    it('swallows Firestore errors instead of throwing', async () => {
      (auth as any).currentUser = { uid: 'user-1' };
      (getFavorites as jest.Mock).mockResolvedValue([]);
      (getHistory as jest.Mock).mockResolvedValue([]);
      (setDoc as jest.Mock).mockRejectedValue(new Error('permission-denied'));

      await expect(pushSyncSnapshot()).resolves.toBeUndefined();
    });
  });

  describe('pullSyncSnapshot', () => {
    it('returns null when no user is authenticated', async () => {
      const result = await pullSyncSnapshot();

      expect(result).toBeNull();
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('returns null when the remote document does not exist', async () => {
      (auth as any).currentUser = { uid: 'user-1' };
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      const result = await pullSyncSnapshot();

      expect(result).toBeNull();
    });

    it('returns the remote favorites and history when present', async () => {
      (auth as any).currentUser = { uid: 'user-1' };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ favorites: [{ city: 'Lyon' }], history: [{ city: 'Nice' }] }),
      });

      const result = await pullSyncSnapshot();

      expect(result).toEqual({ favorites: [{ city: 'Lyon' }], history: [{ city: 'Nice' }] });
    });

    it('returns null when Firestore throws', async () => {
      (auth as any).currentUser = { uid: 'user-1' };
      (getDoc as jest.Mock).mockRejectedValue(new Error('offline'));

      const result = await pullSyncSnapshot();

      expect(result).toBeNull();
    });
  });

  describe('mergeFromCloud', () => {
    it('adds remote favorites and history entries missing locally', async () => {
      (auth as any).currentUser = { uid: 'user-1' };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          favorites: [{ city: 'Lyon', country: 'FR', addedAt: 'a' }],
          history: [{ city: 'Nice', country: 'FR', searchedAt: 'b' }],
        }),
      });
      (getFavorites as jest.Mock).mockResolvedValue([]);
      (getHistory as jest.Mock).mockResolvedValue([]);

      await mergeFromCloud();

      expect(addFavorite).toHaveBeenCalledWith('Lyon', 'FR', 'a');
      expect(addToHistory).toHaveBeenCalledWith('Nice', 'FR', 'b');
    });

    it('does not duplicate favorites or history entries already present locally', async () => {
      (auth as any).currentUser = { uid: 'user-1' };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          favorites: [{ city: 'Lyon', country: 'FR', addedAt: 'a' }],
          history: [{ city: 'Nice', country: 'FR', searchedAt: 'b' }],
        }),
      });
      (getFavorites as jest.Mock).mockResolvedValue([{ id: 1, city: 'Lyon', country: 'FR', addedAt: 'a' }]);
      (getHistory as jest.Mock).mockResolvedValue([{ id: 1, city: 'Nice', country: 'FR', searchedAt: 'b' }]);

      await mergeFromCloud();

      expect(addFavorite).not.toHaveBeenCalled();
      expect(addToHistory).not.toHaveBeenCalled();
    });

    it('does nothing when there is no remote snapshot', async () => {
      await mergeFromCloud();

      expect(getFavorites).not.toHaveBeenCalled();
    });
  });

  describe('syncNow', () => {
    it('delegates to pushSyncSnapshot', async () => {
      (auth as any).currentUser = { uid: 'user-1' };
      (getFavorites as jest.Mock).mockResolvedValue([]);
      (getHistory as jest.Mock).mockResolvedValue([]);

      await expect(syncNow()).resolves.toBeUndefined();
    });
  });
});
