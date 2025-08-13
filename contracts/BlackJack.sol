// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
contract FunctionsConsumerExample is FunctionsClient, ConfirmedOwner, ERC721URIStorage {
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    uint8 private  donHostedSecretsSlotID;
    uint64 private  donHostedSecretsVersion;
    uint64 private  subscriptionId;

    string constant SOURCE = 
    'if(!secrets.apiKey) {throw Error("API key should be provided!");};'
    "const playerAddress = args[0];"
    'const apiResponse = await Functions.makeHttpRequest({url: `https://lambda.925110.xyz/api/nocodb-api?address=${playerAddress}`,headers:{"api-key": secrets.apiKey}});'
    "if (apiResponse.error) {"
    "console.error(apiResponse.error)"
    'throw Error("Request failed")'
    "};"
    "const { data } = apiResponse;"
    "console.log('API response data:', JSON.stringify(data, null, 2));"
    "const recordsAry = data.records;"
    "if (!recordsAry || recordsAry.length === 0) {"
    'console.log("score does not exist");'
    'throw Error("score does not exist");'
    "};"
    "const score = recordsAry[0].score;"
    "return Functions.encodeString(score);";
    uint32 constant GAS_LIMIT = 300_000;
    bytes32 constant DON_ID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;
    

    error UnexpectedRequestID(bytes32 requestId);

    event Response(bytes32 indexed requestId, bytes response, bytes err);

    constructor(
        address router
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) ERC721("BlackJack", "BJK") {}

    function setDonHostSecretConfig(uint8 _slotID, uint64 _version, uint64 _sub_id) public  onlyOwner {
        donHostedSecretsSlotID = _slotID;
        donHostedSecretsVersion = _version;
        subscriptionId = _sub_id;
    }

    /**
     * @notice Send a simple request
     * @param args List of arguments accessible from within the source code
     */
    function sendRequest(
        string[] memory args
    ) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);
        req.addDONHostedSecrets(
            donHostedSecretsSlotID,
            donHostedSecretsVersion
        );
        if (args.length > 0) req.setArgs(args);
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            GAS_LIMIT,
            DON_ID
        );
        return s_lastRequestId;
    }

    /**
     * @notice Store latest result/error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        s_lastResponse = response;
        s_lastError = err;
        // _safeMint(address, tokenID);
        emit Response(requestId, s_lastResponse, s_lastError);
    }
}
