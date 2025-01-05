import { Chain } from "../models/Chain.js";

class BlockchainView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    async init() {
        await this.fetchAndRenderBlocks();
    }

    async fetchAndRenderBlocks() {
        try {
            const chain = Chain.getInstance().getChain()
            this.renderBlocks(chain);
        } catch (error) {
            console.error('Failed to fetch blocks:', error);
            this.renderError('Failed to load blockchain data');
        }
    }

    renderBlocks(blocks) {
        this.container.innerHTML = blocks.map(block => `
            <div class="block">
                <div class="block-header">
                    <span class="block-number">Block #${block.index}</span>
                    <span class="nonce">Nonce: ${block.nonce}</span>
                </div>
                <div>
                    <h3>Transaction:</h3>
                    <table class="transactions-table">
                        <thead>
                            <tr>
                                <th>From</th>
                                <th>To</th>
                                <th>Amount</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${this.truncateAddress(block.transactions.sender)}</td>
                                <td>${this.truncateAddress(block.transactions.receiver)}</td>
                                <td>${block.transactions.amount}</td>
                                <td>${new Date(block.transactions.timestamp).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div>
                    <p>Previous Hash: <span class="hash">${block.previousHash}</span></p>
                    <p>Hash: <span class="hash">${block.hash}</span></p>
                </div>
            </div>
        `).join('');
    }

    truncateAddress(address) {
        if (!address) return 'N/A';
        return address.length > 15 
            ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
            : address;
    }

    renderError(message) {
        this.container.innerHTML = `
            <div class="error">
                <p>${message}</p>
            </div>
        `;
    }
}

export { BlockchainView };

const viewer = new BlockchainView('blockchain-container');