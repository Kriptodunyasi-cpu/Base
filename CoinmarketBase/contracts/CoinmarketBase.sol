// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CoinMarketBase Token
 * @dev First contract for the CoinMarketBase project on Base Sepolia.
 */
contract CoinMarketBase is ERC20, Ownable {
    constructor(address initialOwner) 
        ERC20("CoinMarketBase", "CMB") 
        Ownable(initialOwner) 
    {
        // Mint 1,000,000 CMB tokens to the deployer
        _mint(initialOwner, 1000000 * 10**decimals());
    }

    /**
     * @dev Function to mint more tokens, only callable by the owner.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
