pragma solidity ^0.4.23;

contract MyContract {
    uint public myValue = 0;

    function getValue() public view returns (uint) {
        return myValue;
    }

    function setValue(uint newValue) public returns (uint) {
        myValue = newValue;
        return myValue;
    }
}