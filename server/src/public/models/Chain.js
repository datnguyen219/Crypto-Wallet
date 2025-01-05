import { Block } from './Block.js';
import Redis from 'ioredis';

export class Chain {
    static instance = null;
    
    constructor() {
        this.redis = new Redis({
            host: 'localhost', 
            port: 6379,
        });
        
        this.initializeChain();
    }

    async initializeChain() {
        try {
            const savedChain = await this.redis.get('blockchain');
            if (savedChain) {
                console.log("Pull from Redis");
                const parsedChain = JSON.parse(savedChain);
                this.chain = parsedChain.map(blockData => {
                    const block = new Block(
                        blockData.index,
                        blockData.transactions,
                        blockData.previousHash
                    );
                    block.nonce = blockData.nonce;
                    block.hash = blockData.hash;
                    return block;
                });
                console.log(this.chain);
            } else {
                console.log("Create new");
                this.chain = [this.createGenesisBlock()];
                await this.saveToStorage();
            }
        } catch (error) {
            console.error('Redis initialization error:', error);
            this.chain = [this.createGenesisBlock()];
        }
    }

    static async getInstance() {
        if (!Chain.instance) {
            Chain.instance = new Chain();
            await Chain.instance.initializeChain();
        }
        return Chain.instance;
    }

    createGenesisBlock() {
        const genesisTransaction = {
            sender: "Genesis",
            receiver: "Genesis",
            amount: 0,
            timestamp: new Date(),
            signature: "Genesis"
        };
        return new Block(0, genesisTransaction, "0");
    }

    async saveToStorage() {
        try {
            await this.redis.set('blockchain', JSON.stringify(this.chain));
            const saved = await this.redis.get('blockchain');
            console.log('Blockchain saved to Redis:', saved);
        } catch (error) {
            console.error('Redis save error:', error);
            throw error;
        }
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    async addBlock(transactions) {     
        const previousBlock = this.getLatestBlock();
        const newBlock = new Block(
            this.chain.length,
            transactions,
            previousBlock.hash
        );

        newBlock.mine();
        
        this.chain.push(newBlock);
        await this.saveToStorage();
    }

    getChain() {
        return this.chain;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    async clear() {
        this.chain = [this.createGenesisBlock()];
        await this.saveToStorage();
    }

    async closeConnection() {
        await this.redis.quit();
    }
}