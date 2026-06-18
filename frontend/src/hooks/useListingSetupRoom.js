import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { roomsApi } from '../api/api';

export function useListingSetupRoom() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId') || '';
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(Boolean(roomId));

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    roomsApi.get(roomId)
      .then(({ data }) => {
        if (!cancelled) setRoom(data);
      })
      .catch(() => {
        if (!cancelled) setRoom(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const setupQuery = roomId ? `?roomId=${roomId}` : '';

  return { roomId, room, loading, setupQuery };
}

export function phoneSetupKey(userId) {
  return `stayease.host.setup.${userId}.phone`;
}

export function isPhoneSetupComplete(userId) {
  if (!userId) return false;
  return window.localStorage.getItem(phoneSetupKey(userId)) === '1';
}

export function markPhoneSetupComplete(userId) {
  if (!userId) return;
  window.localStorage.setItem(phoneSetupKey(userId), '1');
}

export function isIdentitySetupComplete(user) {
  return Boolean(user?.identity_proof?.document_url);
}
