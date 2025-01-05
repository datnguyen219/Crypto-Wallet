import express from 'express';
import cors from 'cors';
import {Chain} from "../src/public/models/Chain.js"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let blockchain = null;

const initBlockchain = async () => {
    blockchain = await Chain.getInstance();
};

app.post('/api/transaction', async (req, res) => {
    try {
        if (!blockchain) {
            return res.status(500).json({ error: 'Blockchain not initialized' });
        }
        
        const transaction = req.body;
        await blockchain.addBlock(transaction);
        res.json({ 
            message: 'Transaction added to blockchain',
            chain: blockchain.getChain()
        });
    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;

process.on('SIGINT', async () => {
    if (blockchain) {
        await blockchain.closeConnection();
    }
    process.exit();
});

app.listen(PORT, async () => {
    await initBlockchain();
    console.log(`Server running on port ${PORT}`);
});