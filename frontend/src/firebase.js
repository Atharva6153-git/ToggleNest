import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAK9-ejj1z2lN03oWPVVg9cm8qF01Ju8Nc',
  authDomain: 'togglenest-5155e.firebaseapp.com',
  projectId: 'togglenest-5155e',
  storageBucket: 'togglenest-5155e.firebasestorage.app',
  messagingSenderId: '258684645473',
  appId: '1:258684645473:web:fbe01439f2f36a49147a20',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const githubProvider = new GithubAuthProvider()

export default app