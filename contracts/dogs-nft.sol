// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";


contract Dogs is ERC721, ERC721Enumerable, ERC721URIStorage, VRFConsumerBaseV2Plus {
    uint256 private _nextTokenId;

    uint256 public MAX_AMOUNT = 6;
    mapping(address => bool) public whiteList;
    bool public preMintWindow = false;
    bool public mintWindow = false;
    mapping (uint256 => uint256) reqIdToTokenId;

    // Metadata
    string constant DOG_1 = "ipfs://QmWkJ5UNuZVMthegX69FRMMXs8t4Y1MfCtEfX1wSZafJ76";
    string constant DOG_2 = "ipfs://QmXmwZuZBfSyga995TsYFwvfLvWETUYH5tzjNsVsvnxd2Q";
    string constant DOG_3 = "ipfs://QmNrrevNga68ihpuVchaUPGVQD6BBfibMTNGwoahRABiJ7";
    string constant DOG_4 = "ipfs://QmRUQioe1e6GBjRNUpA6uNXbcA7YadEsna9TegbtYQYR3e";



    // for chainlink VRF
    // Your subscription ID.
    uint256 public s_subscriptionId;
    bytes32 public keyHash =
        0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;



    constructor(uint256 subscriptionId)
        ERC721("Dogs", "DGS")
        VRFConsumerBaseV2Plus(0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B) 
    {
        s_subscriptionId = subscriptionId;
    }

    function preMint() public payable {
        require(preMintWindow, "Premint is not open yet!");
        require(msg.value == 0.001 ether, "The price of dog nft is 0.001 ether");
        require(whiteList[msg.sender], "You are not in the white list");
        require(balanceOf(msg.sender) < 1, "Max amount of NFT minted by an addresss is 1");
        require(totalSupply() < MAX_AMOUNT, "Dog NFT is sold out!");
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        request(false, tokenId);
    } 

    function mint()
        public
        payable 
    {
        require(mintWindow, "Mint is not open yet!");
        require(msg.value == 0.005 ether, "The price of dog nft is 0.005 ether");
        require(totalSupply() < MAX_AMOUNT, "Dog NFT is sold out!");
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        request(false, tokenId);
    }
    // 提取余额
    function withDraw(address addr) external  onlyOwner {
        //  address(this).balance 原生token 或者eth数量。 
        // balanceOf(owner)是持有的nft数量
        payable(addr).transfer(address(this).balance);

    }

    function request(
        bool enableNativePayment,
        uint256 tokenId
    ) internal  returns (uint256 requestId) {
        // Will revert if subscription is not set and funded.
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: enableNativePayment
                    })
                )
            })
        );
        reqIdToTokenId[requestId] = tokenId;
        return requestId;
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        uint256 randomNumber = _randomWords[0];
        uint256 tokenId = reqIdToTokenId[_requestId];
        if (randomNumber % 4 == 0) {
            _setTokenURI(tokenId, DOG_1);
        } else if (randomNumber % 4 == 1) {
            _setTokenURI(tokenId, DOG_2);
        } else if (randomNumber % 4 == 2) {
            _setTokenURI(tokenId, DOG_3);
        }else {
            _setTokenURI(tokenId, DOG_4);
        }
    }

    function addToWhiteList(address[] calldata addrs) public onlyOwner {
        for (uint256 i = 0; i < addrs.length; i++) {
            whiteList[addrs[i]] = true;
        }
    }

    function setWindow(bool _preMintOpen, bool mintOpen) public onlyOwner {
        preMintWindow = _preMintOpen;
        mintWindow = mintOpen;
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
