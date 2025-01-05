import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import './App.css';

interface WalletKeys {
    publicKey: string;
    privateKey: string;
}

interface Transaction {
    sender: string;
    receiver: string;
    amount: string;
    timestamp: number;
    signature: string;
}

const API_URL = 'http://localhost:3001/api';

const App: React.FC = () => {
    const [keys, setKeys] = useState<WalletKeys | null>(null);
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const storedKeys = localStorage.getItem('walletKeys');
        if (storedKeys) {
            setKeys(JSON.parse(storedKeys));
        }
    }, []);
    

    const generateKeys = async () => {
        try {
            const keyPair = await globalThis.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );

            const exportedPublicKey = await globalThis.crypto.subtle.exportKey(
                "spki",
                keyPair.publicKey
            );
            const exportedPrivateKey = await globalThis.crypto.subtle.exportKey(
                "pkcs8",
                keyPair.privateKey
            );

            const publicKey = Buffer.from(exportedPublicKey).toString('base64');
            const privateKey = Buffer.from(exportedPrivateKey).toString('base64');
            const newKeys = { publicKey, privateKey };

            setKeys(newKeys);
            localStorage.setItem('walletKeys', JSON.stringify(newKeys));
        } catch (err) {
            setError('Failed to generate keys');
            console.error(err);
        }
    };

    const signTransaction = async (transaction: Omit<Transaction, 'signature'>) => {
        if (!keys) return null;

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(transaction));
        
        const privateKeyBuffer = Buffer.from(keys.privateKey, 'base64');
        const keyFormat = await globalThis.crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            {
                name: 'RSA-PSS',
                hash: 'SHA-256',
            },
            false,
            ['sign']
        );

        const signature = await globalThis.crypto.subtle.sign(
            {
                name: 'RSA-PSS',
                saltLength: 32,
            },
            keyFormat,
            data
        );

        return Buffer.from(signature).toString('base64');
    };

    const sendTransaction = async () => {
        if (!keys || !receiver || !amount) {
            setError('Missing required fields');
            return;
        }

        try {
            const transaction = {
                sender: keys.publicKey,
                receiver,
                amount,
                timestamp: Date.now(),
            };

            const signature = await signTransaction(transaction);
            if (!signature) {
                throw new Error('Failed to sign transaction');
            }

            const response = await fetch(`${API_URL}/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({
                    ...transaction,
                    signature,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send transaction');
            }

            setReceiver('');
            setAmount('');
            setError('');
        } catch (err) {
            setError('Failed to send transaction');
            console.error(err);
        }
    };

    return (
        <div className="container">
            <h1 className="title">Simple Wallet</h1>
            {error && <div className="error">{error}</div>}
            
            {!keys ? (
                <button className="button" onClick={generateKeys}>Generate Keys</button>
            ) : (
                <div>
                    <div className="key-display">
                        <strong>Public Key:</strong>
                        <div className="key-text">{keys.publicKey}</div>
                    </div>

                    <div className="transaction-form">
                        <input
                            className="input"
                            type="text"
                            value={receiver}
                            onChange={(e) => setReceiver(e.target.value)}
                            placeholder="Receiver Address"
                        />
                        <input
                            className="input"
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount to Send"
                        />
                        <button className="button" onClick={sendTransaction}>Send Money</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;