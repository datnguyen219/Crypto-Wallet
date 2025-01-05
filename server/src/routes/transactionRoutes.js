import express from 'express';
import { Chain } from '../public/models/Chain.js';
import { verifySignature } from '../utils/crypto.js';

const router = express.Router();
const blockchain = Chain.getInstance();
router.post('/transaction', async (req, res) => {
    try {
        const transaction = req.body;
        
        if (!transaction.sender || !transaction.receiver || !transaction.amount || !transaction.signature) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        const isValidSignature = await verifySignature(
            {
                sender: transaction.sender,
                receiver: transaction.receiver,
                amount: transaction.amount.toString(),
                timestamp: transaction.timestamp
            },
            transaction.signature,
            transaction.sender
        );

        if (!isValidSignature) {
          console.log("Not valid signature")
        }

        blockchain.addBlock(transaction);

        res.status(201).json({
            message: 'Transaction processed successfully',
        });

    } catch (error) {
        console.error('Transaction processing error:', error);
        res.status(500).json({
            error: 'Failed to process transaction',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;