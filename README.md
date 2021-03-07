# subrepos

## Intro

Subrepos act as a sort of staging server, between dependancies and applications and the network of end-users.
Subrepos are also integral to our DAO. Each subrepo contains a list of cryptocurrency wallet ID's.
The DAO is a heigherache of smart contracts - each smart contract pays to the wallet addresses of the dependacies. 
For example:

Smart Contract A: Pays to the subordinate Smart Contracts which serve as escrow accounts
Smart Contract B1: Receives 56% of Smart Contract A and forwards it to Smart Contract C (Wave App Users)
Smart Contract B2: Receives 23% of Smart Contract A and forwards it to Smart Contract D (Financeers: investors/ lenders) 
Smart Contract B3: Receives 23% of Smart Contract A and forwards it to Smart Contract E (Developers of Repos indexed in this Branch)
Smart Contract C: Contains a dymanic list of HotspotBnB users which have the Wave App installed (automates payment to BitRefill/ Althea.net App)
Smart Contract D: Contains a dynamic list of Financeers e.g. investors & lenders. Funds divide between lenders as interest/load repayments and between investors as royalties
Smart Contract E: Contains a dynamic list of developers e.g. owners of the repos indexed in this branch as subrepos


