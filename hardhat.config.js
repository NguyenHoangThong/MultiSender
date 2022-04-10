const path = require("path");

require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
require("hardhat-contract-sizer");
require("@nomiclabs/hardhat-waffle");
const dotenv = require('dotenv');



//load env
dotenv.config({ path:  path.resolve(__dirname, './env/.env')});

const config = {
  solidity: {
    compilers: [
      {
        version: '0.8.10',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      }
    ],
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545',
      accounts: {mnemonic: process.env.MNEMONIC},
      gas : 20e12,
      allowUnlimitedContractSize: true

    },
    bsctestnet: {
      url: 'https://data-seed-prebsc-2-s2.binance.org:8545/',
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
    },
    bsc: {
      url: 'https://bsc-dataseed.binance.org',
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
    },
    matic: {
      url: 'https://rpc-mainnet.maticvigil.com',
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      gasPrice: 20e9
    },
    test: {
      url: 'https://rpc-mainnet.maticvigil.com',
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      gasPrice: 20e9
    },
    mumbai: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      gasPrice: 1e9
    },
    fuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43113,
      accounts: [`${process.env.PRIVATE_KEY}`]
    },
    avalanche: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43114,
      accounts: []
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.API_KEY
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 5,
    enabled: !!process.env.REPORT_GAS,
  },
  namedAccounts: {
    test: 0,
    creator: 0,
    deployer: 0,
  }
};

module.exports = config