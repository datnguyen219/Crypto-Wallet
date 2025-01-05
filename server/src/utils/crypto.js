function customHash(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    let chr;
    for (let i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    
    hash ^= hash << 13;
    hash ^= hash >> 17;
    hash ^= hash << 5;
    
    const hashHex = (hash >>> 0).toString(16).padStart(8, '0');
    
    let finalHash = '';
    for (let i = 0; i < hashHex.length; i++) {
        const char = hashHex.charCodeAt(i);
        finalHash += ((char * 7) % 16).toString(16);
    }
    
    return finalHash.padStart(64, '0');
}

export const verifySignature = async (transactionData, signature, publicKey) => {
    try {
        const dataHash = customHash(transactionData);
        
        const isValid = dataHash.startsWith(signature.slice(0, 8));
        
        return isValid;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
};