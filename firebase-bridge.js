import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signOut} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,collection,getDocs,runTransaction} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
import {createGateway} from './firebase-gateway.js';

const unavailable=async()=>new Response(JSON.stringify({error:'Add your Firebase configuration in firebase-config.js, then reload.'}),{status:503,headers:{'Content-Type':'application/json'}});
if(firebaseConfig.apiKey.startsWith('PASTE_')||firebaseConfig.projectId.startsWith('PASTE_')){
 window.rhythmsApiReady(unavailable);
}else{
 try{
  const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
  await new Promise((resolve,reject)=>{let unsubscribe=()=>{};unsubscribe=onAuthStateChanged(auth,()=>{unsubscribe();resolve()},reject)});
  window.rhythmsApiReady(createGateway({auth,db,sdk:{doc,getDoc,setDoc,collection,getDocs,runTransaction}}));
  const signIn=document.getElementById('signInLink'),signOutLink=document.getElementById('signOutLink');
  signIn.addEventListener('click',async e=>{e.preventDefault();try{await signInWithPopup(auth,new GoogleAuthProvider());location.reload()}catch(error){document.getElementById('accountStatus').textContent='Google sign-in: '+(error.message||'Could not sign in.')}});
  signOutLink.addEventListener('click',async e=>{e.preventDefault();try{await signOut(auth);location.reload()}catch(error){document.getElementById('accountStatus').textContent=error.message||'Could not sign out.'}});
 }catch(error){window.rhythmsApiReady(unavailable)}
}
