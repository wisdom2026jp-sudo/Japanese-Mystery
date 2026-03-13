/**
 * clear-history.js
 * Firestore의 generation_history 컬렉션 전체 삭제
 * 실행: node clear-history.js
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC3RHk_Vd23IZuAUo9slaJcAqaRpE3smXE",
  authDomain: "mystery-factory-pro.firebaseapp.com",
  projectId: "mystery-factory-pro",
  storageBucket: "mystery-factory-pro.firebasestorage.app",
  messagingSenderId: "501896528089",
  appId: "1:501896528089:web:2faf6bb549ca1eaac2bec8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearAll() {
  const snap = await getDocs(collection(db, 'generation_history'));
  console.log(`총 ${snap.docs.length}개 이력 삭제 중...`);
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'generation_history', d.id))));
  console.log('✅ 전체 삭제 완료!');
  process.exit(0);
}

clearAll().catch(e => { console.error(e); process.exit(1); });
