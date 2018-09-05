## About
A simple nodejs app showing how to compile, deploy and call a simple ethereum contract.

## Gas & gas limits
The contract deployment and contract messaging code (setValue method) assumes the transaction will be valid on
the blockchain without spending gas.

We are using a deployment of Parity's Aura PoA blockchain here. Specifically, we're using Azure PoA Ethereum Consortium.
That's why we're able to generate a brand new address and use it to deploy and call contracts and not worry about gas/ether.
