/* Package Imports */
const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid/v1');

/* Blockchain Data Structure */
function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];

    // assign current node url
    this.currentNodeUrl = currentNodeUrl;

    // let node be aware of other nodes on the network
    this.networkNodes = [];

    // generate genesis block
    this.createNewBlock(100, '0', '0');
};

/* Blockchain Prototype Methods */
Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    // create a new block on the chain
    const newBlock = {
        index: this.chain.length + 1,
        timeStamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce,
        previousBlockHash,
        hash
    };
    // clear transactions array
    this.pendingTransactions = [];
    // add the new block to the chain
    this.chain.push(newBlock);
    // return the new block
    return newBlock;
};

Blockchain.prototype.getLastBlock = function () {
    // return last block on the chain
    return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {
    // create a unique transaction id
    const transacationId = uuid().split('-').join('');
    // create transaction object
    const newTransaction = {
        amount,
        sender,
        recipient,
        transacationId
    };
    // return new transaction
    return newTransaction;
};

Blockchain.prototype.addTransactionToPendingTransactions = function (transaction) {
    // add to the transactions array
    this.pendingTransactions.push(transaction);
    // find new transaction (last block on chain)
    const lastBlock = this.getLastBlock();
    // return the number of the block the transaction was added to
    return lastBlock['index'] + 1;
};

Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    // change data to a single string
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    // create hash of data
    const hash = sha256(dataAsString);
    // return the hash
    return hash;
};

Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    // define a nonce
    let nonce = 0;
    // hash data
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    // check for correct hash value
    while (hash.substring(0, 4) !== '0000') {
        // increment nonce by 1
        nonce++;
        // run hashblock method again
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    };
    // return nonce
    return nonce;
};

Blockchain.prototype.chainIsValid = function (blockchain) {
    // create flag to declare if chain is valid
    let validChain = true;

    // iterate through every block on the chain
    // start at 1 to skip genisis block
    for (let i = 1; i < blockchain.length; i++) {
        // compare current block to prev block
        const currentBlock = blockchain[i];
        const previousBlock = blockchain[i - 1];

        // create block hash
        const blockHash = this.hashBlock(previousBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
        // check to see if block hash is valid
        if (blockHash.substring(0, 4) !== '0000') {
            validChain = false;
        };

        // compare hashes to see if chain is invalid
        if (currentBlock['previousBlockHash'] !== previousBlock['hash']) {
            // set validChain to false
            validChain = false;
        };
    };
    // get genisis block
    const genisisBlock = blockchain[0];
    console.log(genisisBlock)
    // check all props on genisis block are correct
    const correctNonce = genisisBlock['nonce'] === 100;
    const correctPreviousBlockHash = genisisBlock['previousBlockHash'] === '0';
    const correctHash = genisisBlock['hash'] === '0';
    const correctTransactions = genisisBlock['transactions'].length === 0;

    // runs the test
    if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) {
        validChain = false;
    };

    // return valid chain
    return validChain;
};

Blockchain.prototype.getBlock = function (blockHash) {
    // create flag to know if correct block
    let correctBlock = null;
    // iterate through block chain to find the matching hash
    this.chain.forEach(block => {
        // check if hashes match
        if (block.hash === blockHash) {
            correctBlock = block;
        };
    });
    // return the correct block
    return correctBlock;
};

Blockchain.prototype.getTransaction = function (transactionId) {
    // create flag to declare if we found a transaction that matches
    let correctTransaction = null;
    // another one to house the block
    let correctBlock = null;
    // iterate through blocknchain
    this.chain.forEach(block => {
        // iterate through transactions on each block
        block.transactions.forEach(transaction => {
            // check if the current transaction id matches the one supplied by user
            if (transaction.transacationId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            }
        })
    });
    // return an obj with info
    return {
        transaction: correctTransaction,
        block: correctBlock
    };
};

Blockchain.prototype.getAddressData = function (address) {
    // keep track of transactions data
    const addressTransactions = [];
    // iterate through the transactions
    this.chain.forEach(block => {
        // iterate through block transactions
        block.transactions.forEach(transaction => {
            // check to see if the sender or recipient adresses match the one recieved by user
            if (transaction.sender === address || transaction.recipient === address) {
                // push to the array keeping track of addresses
                addressTransactions.push(transaction);
            };
        });
    });
    // find balance 
    let balance = 0;
    // iterate through addressTransactions
    addressTransactions.forEach(transaction => {
        if (transaction.recipient === address) {
            balance += transaction.amount;
        } else if (transaction.sender === address) {
            balance -= transaction.amount;
        }
    });

    // return an obj with data
    return {
        addressTransactions,
        addressBalance: balance
    };
}

/* Export Blockchain Data Structure */
module.exports = Blockchain;