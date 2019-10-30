import Neon, { api, wallet, tx, sc, nep5, rpc, u } from "@cityofzion/neon-js";

const testUserAccount = Neon.create.account("10bb731683dddc262d61ddd528ad27d9890c6fbc478b855a67a49cf62c136399");
const contractScriptHash = "30f41a14ca6019038b055b585d002b287b5fdd47";
const rpcUrl = "http://127.0.0.1:49332";

const script = Neon.create.script({
    scriptHash: contractScriptHash,
    operation: "refund",
    args: [testUserAccount.scriptHash]
});

async function mainAsync() {
    const contractWitness = await api.getVerificationSignatureForSmartContract(rpcUrl, contractScriptHash);

    let refundTx = new tx.InvocationTransaction({
        script: script,
        gas: 0,
        inputs: [
            {
                prevHash: "d2cbfbe9bec47318113e4d41c95174023851df74d7cb2a9e4049d5c84d2b2a6d",
                prevIndex: 0
            }],
        outputs: [
            {
                assetId: Neon.CONST.ASSET_ID.NEO,
                value: 1000,
                scriptHash: contractScriptHash
            }
        ]
    });
    
    refundTx.addAttribute(
        tx.TxAttrUsage.Script, 
        u.reverseHex(wallet.getScriptHashFromAddress(testUserAccount.address)));
    
    const signature = wallet.sign(
        refundTx.serialize(false),
        testUserAccount.privateKey);
    
    refundTx.addWitness(tx.Witness.fromSignature(signature, testUserAccount.publicKey));
    refundTx.addWitness(contractWitness);

    console.log(JSON.stringify(refundTx.export(), null, 2));
    console.log(refundTx.hash);
    const client = new rpc.RPCClient(rpcUrl);
    var response = await client.sendRawTransaction(refundTx);

    console.log("\n\n--- Response ---");
    console.log(response);
}

mainAsync().catch(err => { console.log(err); });
