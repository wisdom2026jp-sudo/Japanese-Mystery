/**
 * firebaseService.ts
 * Firebase Firestore - 생성 이력 저장/조회
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, doc, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { HistoryItem } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyC3RHk_Vd23IZuAUo9slaJcAqaRpE3smXE",
  authDomain: "mystery-factory-pro.firebaseapp.com",
  projectId: "mystery-factory-pro",
  storageBucket: "mystery-factory-pro.firebasestorage.app",
  messagingSenderId: "501896528089",
  appId: "1:501896528089:web:2faf6bb549ca1eaac2bec8",
  measurementId: "G-D54LP3CGRB"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const HISTORY_COLLECTION = 'generation_history';

/** 이력 저장 (이미지 base64 제외) */
export async function saveHistoryToFirestore(item: Omit<HistoryItem, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, HISTORY_COLLECTION), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** 이력 불러오기 (최신 30개) */
export async function loadHistoryFromFirestore(): Promise<HistoryItem[]> {
  const q = query(
    collection(db, HISTORY_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toLocaleString('ko-KR') ?? d.data().createdAt,
  } as HistoryItem));
}

/** 이력 삭제 */
export async function deleteHistoryFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, HISTORY_COLLECTION, id));
}
