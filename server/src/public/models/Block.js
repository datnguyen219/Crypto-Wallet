export class Block {
    constructor(index, transactions, previousHash = '') {
        this.difficulty = 4;
        this.maximumNonce = 500000;
        this.index = index;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    customHash(data) {
        const str = JSON.stringify(data);
        let hash = '';
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            const hexChar = ((char * 31 + this.nonce) % 16).toString(16);
            hash += hexChar;
        }

        while (hash.length < 64) {
            const lastChar = hash[hash.length - 1] || 'f';
            const newChar = ((parseInt(lastChar, 16) * 7 + this.nonce) % 16).toString(16);
            hash += newChar;
        }

        return hash.slice(0, 64);
    }

    calculateHash() {
        const blockData = {
            index: this.index,
            transactions: this.transactions,
            previousHash: this.previousHash,
            nonce: this.nonce,
            timestamp: Math.floor(Date.now() / 1000)
        };
        
        return this.customHash(blockData);
    }

    mine() {
        const target = "0".repeat(this.difficulty);
        while (this.hash.substring(0, this.difficulty) !== target && 
               this.nonce < this.maximumNonce) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        if (this.nonce >= this.maximumNonce) {
            return false;
        }
        return true;
    }
}