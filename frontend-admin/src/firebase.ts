import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Config được lấy từ file google-services.json trong thư mục chat-test.
// Nếu bạn có config Web riêng trên Firebase Console, hãy thay thế lại cho đúng.
const firebaseConfig = {
  apiKey: 'AIzaSyA8qEK2BGMGHRZBC8xgLHZwGFC_Z8VsSMs',
  authDomain: 'gen-lang-client-0934000042.firebaseapp.com',
  projectId: 'gen-lang-client-0934000042',
  storageBucket: 'gen-lang-client-0934000042.firebasestorage.app',
  messagingSenderId: '595180731029',
  appId: '1:595180731029:web-placeholder',
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
