// WebCrypto helpers for E2EE using ECDH over P-256 and AES-GCM

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
  const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return { keyPair, publicKeyJwk };
}

export async function importPeerPublicKey(publicKeyJwk) {
  return await window.crypto.subtle.importKey(
    'jwk',
    publicKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

async function deriveAesKey(privateKey, peerPublicKey, saltBytes) {
  const sharedSecret = await window.crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    privateKey,
    256
  );
  const concat = new Uint8Array(sharedSecret.byteLength + saltBytes.byteLength);
  concat.set(new Uint8Array(sharedSecret), 0);
  concat.set(saltBytes, new Uint8Array(sharedSecret).byteLength);
  const hash = await window.crypto.subtle.digest('SHA-256', concat);
  return await window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(plaintext, privateKey, peerPublicKeyJwk) {
  const peerPub = await importPeerPublicKey(peerPublicKeyJwk);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const aesKey = await deriveAesKey(privateKey, peerPub, salt);
  const ciphertextBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    TEXT_ENCODER.encode(plaintext)
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertextBuf))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    alg: 'ECDH-AES-GCM'
  };
}

export async function decryptMessage(ciphertextB64, ivB64, saltB64, privateKey, peerPublicKeyJwk) {
  const peerPub = await importPeerPublicKey(peerPublicKeyJwk);
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const aesKey = await deriveAesKey(privateKey, peerPub, salt);
  const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
  const plaintextBuf = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );
  return TEXT_DECODER.decode(plaintextBuf);
}

export async function importPrivateKeyFromIndexedDB() {
  return await window.crypto.subtle.importKey(
    'jwk',
    JSON.parse(localStorage.getItem('e2ee_private_jwk')),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey', 'deriveBits']
  );
}

export async function ensureLocalKeypairAndUpload(usersAPI) {
  let privJwkStr = localStorage.getItem('e2ee_private_jwk');
  let pubUploaded = localStorage.getItem('e2ee_public_uploaded');
  if (!privJwkStr || !pubUploaded) {
    const { keyPair, publicKeyJwk } = await generateKeyPair();
    const privateJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
    localStorage.setItem('e2ee_private_jwk', JSON.stringify(privateJwk));
    await usersAPI.updatePublicKey(publicKeyJwk);
    localStorage.setItem('e2ee_public_uploaded', '1');
  }
}



