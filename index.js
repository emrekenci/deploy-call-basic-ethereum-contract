const express = require('express');
const app = express();
const fs = require('fs');
const solc = require('solc');
var wallet = require('ethereumjs-wallet')
var ethereumjs = require('ethereumjs-tx')
var Web3 = require('web3');

// Generate a new Ethereum account to use for deployment and sending messages to contracts
var account = wallet.generate();
var accountAddress = account.getAddressString()
var privateKey = account.getPrivateKey();

// The address where you can find the contract at on the blockchain.
// This is an output of the contract deployment on the blockchain. Once you deploy your contract,
// you will get a transaction hash. Check the details of that transaction using the /getTx method below.
// The contract address will be the "creates" value in the result.
var contractAddress = "0xa13270efed99e6f01878f99d3ba142e465214097";

// Our miner node's RPC endpoint
var rpcUrl = "http://eth53hgra-dns-reg1.westeurope.cloudapp.azure.com:8540";
var web3 = new Web3(rpcUrl);

app.use(express.json())
var port = 5000;
app.listen(port, () => {
    console.log("App is starting. Listening on port: " + port);
});

// Get the details of a transaction
app.get('/getTx', async (req, res) => {
    var tx = await web3.eth.getTransaction(req.query.txHash);
    return res.send(tx);
})

// Depoy the contract defined in ./MyContract.sol
app.get('/deploy', async (req, res) => {
    try {
        var source = fs.readFileSync("./MyContract.sol", 'utf8');
        var compiledContract = solc.compile(source, 1);
        var bytecode = compiledContract.contracts[':MyContract'].bytecode;
        var data = '0x' + bytecode;

        // Get the current nonce of the account. We are not using the transaction count.
        // It's just a way to get the nonce so ignore that.
        web3.eth.getTransactionCount(accountAddress, function (err, nonce) {
            var rawTx = {
                nonce: nonce,
                gasPrice: '0x00',
                gasLimit: '0x2FAF080',
                value: '0x00',
                data: data
            }

            var tx = new ethereumjs(rawTx);

            tx.sign(privateKey);

            var raw = '0x' + tx.serialize().toString('hex');

            web3.eth.sendSignedTransaction(raw, function (txErr, transactionHash) {
                if (txErr) {
                    return res.send("something went wrong: " + txErr);
                }
                return res.send(transactionHash);
            });
        });
    } catch (error) {
        console.error(error);
        return res.send("nok");
    }
});

// Read data from a contract on the blockchain
// Call the getValue method in the contract.
app.get('/getValue', async (req, res) => {
    var source = fs.readFileSync("./MyContract.sol", 'utf8');
    var compiledContract = solc.compile(source, 1);
    var abi = compiledContract.contracts[':MyContract'].interface;
    var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);
    var currentValue = await contract.methods.getValue().call();

    return res.send(currentValue);
});

// Write data to a contract on the blockchain.
// Call the setValue method in the contract.
// "changing" a value stored on the blockchain requires sending a transaction.
// This method returns the hash of the transaction we send.
app.get('/setValue', async (req, res) => {
    try {
        var source = fs.readFileSync("./MyContract.sol", 'utf8');
        var compiledContract = solc.compile(source, 1);
        var abi = compiledContract.contracts[':MyContract'].interface;
        var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);
        var data = contract.methods.setValue(req.query.newValue).encodeABI();
    
        web3.eth.getTransactionCount(accountAddress, function (err, nonce) {
            var rawTx = {
                nonce: nonce,
                to: contractAddress,
                gasPrice: '0x00',
                gasLimit: '0x2FAF080',
                value: '0x00',
                data: data
            }
    
            var tx = new ethereumjs(rawTx);
    
            tx.sign(privateKey);
    
            var raw = '0x' + tx.serialize().toString('hex');
    
            web3.eth.sendSignedTransaction(raw)
            .on('transactionHash', hash => {
                return res.send(hash);
            })
            .then(receipt => {
                console.log('Tx Mined', receipt)
                if(receipt.status == '0x1' || receipt.status == 1){
                    console.log('Transaction Success')
                }
                else
                    console.log('Transaction Failed')
            })
            .catch( err => {
                console.error('Something went wrong: ' + err)
            })
        });
    } catch(error) {
        console.error('Something went wrong: ' + err)
    }
})