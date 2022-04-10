const  {parseUnits} = require ('ethers/lib/utils');

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();
    await deploy('MultiSender', {
        name: 'MultiSender',
        from: deployer,
        log: true,
    });
};
module.exports.tags = ['multisender'];