Introduction
~~~~~~~~~~~~~~

This document details the DATRO Consortiums "Tech House II".

Relevant fiscal data is retrieved from DATRO's federated accounting solution. Bookkeeping/accounts is no exception where it concerns federated localhost Progressive WebApp(PWA)'s. 
DATRO's Decentralized Autonomous Societies (DAS)'s smart contracts, then scrape the latest report to determine what suppliers (and what amounts and when) to autonomously pay. 
At this time fiscal data isn't retrieved fully autonomously during the document re-compile/update (rebuild.sh) process. 
The custom script (custom.sh) and data import methodology still needs more improvement before this can happen.
This report is subsequently compiled manually, which is currently intensive since the report is new and exports must be manually adjusted to fit the documents desired format, especially where it concerns data and tables. 

Adjustments to the exported data thus far includes:

1. We want to keep the references on transactions as a single string so the line doesn't break to fit the columb width. e.g. lease_debit_2020/09/01
2. We want to append `.. centered::` to every entry in the csv file. This helps verticle alignment too. And is better than auto, where some items are left aligned, some right aligned etc
3. We make select entries bold or italic (by appending 1 or 2 stars to the beginning and end of the data e.g. **bold**, *italic* etc
4. We change the titles of the columbs e.g. `currency` becomes `unit` and `transaction amount` = `volume` - This allows more columbs to squeez into the document. And eliminates horizontal table scrolls on the compiled html view.
5. Invert the negatives and positives (on all numbers). This way the final balance will show as a minus if funds are owed, not a positive number which might be considered an overpayment/ credit. 
6. Seperate the final balance into a seperate table. This way the number of columbs can be fewer, since we only really need to have a columb for the `balance` and a columb for currency `USD` and one for the amount itself e.g. `-36.24` 
7. Date format DD-MM-YYYY > YYYY/MM/DD


