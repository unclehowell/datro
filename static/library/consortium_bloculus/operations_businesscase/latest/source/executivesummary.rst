Executive Summary 
====================

DATRO is a for-profit consortium that is currently pioneering (and actively beta testing) its own web3.0 internet service along the 70km "Scottish Bay" caribbean coastline.
This new fixed communications infrastructure comprises of geodesic communications equipment rooms (entitled "Neo Dome's"), which are solar powered and mesh together using licence-free Radio Frequencies (RF).


The entire network, including the communication rooms blueprints to the software which operates them and the end-users wireless access points, are in the public domain under a General Public Licence (GPL) - allowing anyone, anywhere to launch the same secure and decentralized network in their area. 
The purpose of this document is to introduce a component of this network entitled the Bloculus Protcol, which is to become the underlying foundations of this entire network. 
This document will also briefly explore the business model and subsequent business opportunities surrounding the Bloculus protocol.

Challenge
~~~~~~~~~~~
The Bloculus protocol is being developed in order to overcome a few core challenges; 

	1. Each newly constructed Neo Dome needs a suitable protocol to quickly, securely and autonomously locate and pair with neighbouring Neo Dome's over licence-free Radio Frequencies 

	2. After establishing secure radio links, the DWeb/Web3.0 nodes hosted inside the dome(s), must have a method to autonomously pair to their corresponding nodes inside neighbouring domes

        3. Character lengths/ texstrings must be short enough for the protocol to operate effectively over low-bandwidth/low-cost/low-energy fallback radio links e.g. LoRaWAN, Cellular USSD etc

        4. The same protocol used to establish links of equipment rooms and nodes contained within, will serve to route and re-route traffic over the network e.g. uptime monitoring etc 

        5. Protocol will be exclusive to the DATRO Consortium. Usage of the protocol will be autonomously compesated by the nodes using it, using cryptocurrency smart contracts e.g. a Decentralized Autonomous Organization (DAO)  


Solution & Outcomes
~~~~~~~~~~~~~~~~~~~~~~~
This new protocol has been named Bloculus, which is a combination of the two primary words which best describe it:
 - 'Bloc' is a referece to Blockchain (particularly the Polkadot blockchain which is used in this protocols day-to-day operations) 
 - 'Loculus' is an architectural and biological reference, used to describe a "little place" and/or compartmentalisation   

The Bloculus protocol works by combining Uber's hexagonal ("H3") grid reference system with the Top Level Domain platform: Handshake. 
The result is a dedicated Top Level Domain (TLD) for each hexagonal grids unique reference.
Initially the protocol and TLD's function on a Local Area Network (LAN) basis, then when a gateway exists on the network, the TLD's validate and become accessible to the Wide Area Network (WAN).
In order to share in the excitement and opportuntities surrounding this new protocol, it's worth having a basic understanding of Ubers H3 system and the Handshake platform. 

There's a multitude of grid reference systems in operation e.g. Universal Transverse Mercator (UTM), Military Grid Reference System (MGRS) etc 
One of the most unique is Ubers H3 solution, which instead of referencing a point or square on a map it uses hexagonals, commonly known as "honeycombs". 
A key feature of H3 used by DATRO is called "resolution", which permits the size of these honeycombs to be selected from a shortlist.


+------------------------+---------------------------+-------------------------------------+-------------------------------------------------+
|H3 Resolution           | Avg. Hexagon Area (km2)   | Avg. Hexagon Edge Length (km)       |                 No. of unique indexes           |
+========================+===========================+=====================================+=================================================+
| .. centered:: 5        | .. centered:: 252.9033645 | .. centered:: 8.544408276           |  .. centered:: 2,016,842                        |
+------------------------+---------------------------+-------------------------------------+-------------------------------------------------+
| .. centered:: 6        | .. centered:: 36.1290521  | .. centered:: 3.229482772	   |  .. centered:: 14,117,882                       |
+------------------------+---------------------------+-------------------------------------+-------------------------------------------------+
| .. centered:: 7        | .. centered:: 5.1612932   | .. centered:: 1.220629759	   |  .. centered:: 98,825,162                       |
+------------------------+---------------------------+-------------------------------------+-------------------------------------------------+
| .. centered:: 8        | .. centered:: 0.7373276   | .. centered:: 0.461354684	   |  .. centered:: 691,776,122                      |
+------------------------+---------------------------+-------------------------------------+-------------------------------------------------+

For DATRO's new network, 500 meter long honeycombs are sufficient for a balance between security obscurity and locationv accuracy.
The closest suitable resolution is therefore resolution 8, which sets the honeycombs lengths to 461 Meters.
Each of which has a dedicated 15 digit unique reference ID e.g. 8843a13687fffff

.. image::  _static/h5-h8-sb.png
   :width: 620px
   :alt: `Bloculus, Scottish Bay,DR`

   `Bloculus, Scottish Bay, DR` 

There's a 'self-service website <https://observablehq.com/@sw1227/h3-index-visualizer>'__ for experiencing H3 in action without having to set it up locally.
You can right click and edit the map and enter a UTM co-ordinate to specify the location. (remembering to reverse longitude and latitude). 
This is better than trying to pan and zoom to find a location, since the website is heavy on resources and crashes.
 
In any case, use of these h3 references isn't something which can be exclusively owned and controlled. So how to we overcome this challenge ? 
Enter Handshake. To understand Handshake its best to first understand Top Level Domains (TLD's).
TLD's are unique in nature e.g. dot com (.com) for example is only able to be possesed by a single entity at any one time.
If two entities both provided the TLD .com at the same time, how would a network know which party's .com to direct traffic to when someone enteres a .com url into their browser ? 
.com used to be owned by the United States Department of Defense, but today it's operated by Verisign.
Until Handshake came along, you could only obtain a TLD through an expensive and lengthy processes ($130k - $180k and 6+ months) with ICANN (which also offered no guarentees). 
The Handshake platform has democratised and cheapened this process through what is known as a candle auction. Now registration only takes a few dollars and a couple of days.  

In the case of the Bloculus protocol its possible to have a dedicated TLD for each H3 reference e.g. .8843a13687fffff  
The nodes running in the domes are categorised and these categories are listed as the domain name e.g. messaging.8843a13687fffff
And finally the name of the service running in the dome is listed as the subdomain e.g. matrix.messaging.8843a13687fffff 

The domes can now establish links autonomously, since the addressing system contains the physical location.
Next the services/ nodes running inside each dome can pair quickly by specifying the corresponding domain and subdomain. 
And later, when the network is a few domes and nodes in size, the Bloculus protocol can be used to route traffic around the network, more effectively than anything in existance.
 

Market Potential
~~~~~~~~~~~~~~~~~~~~ 

DATRO's approach is to sell 50% co-ownership (co-lessor rights) for a one time fixed sum of $500 USD per 460 meter honeycomb.
For this price the Scottish Bay alone will generate in the region of circa $1.4M USD of digital real estate inventory for the consortium to sell.
The area is defined by the 70km width of the coastline and the depth is inland as far as the west/southern boundaries of the two provinces which make up the Scottish Bay.    
The services and nodes inside each dome effectively become lessee's, using cryptocurrency smart contracts to lease use and enjoyment of the Bloculus protocol.
The proceeds of which will pool together and divide proportionately between the protocols lessors/ beneficiaries. 
Henceforth the Scottish Bay will become the first of many estates, of this new protocol.
Furthermore, the web3.0 services and nodes on this new fixed communications network, are expected to be the first of many types of digital lessee's which will pay to use the Bloculus protocol.


Recommendation
~~~~~~~~~~~~~~~~~

It's recommended the consortium expand on this business case and produce a dedicated whitepaper on the technology. 
It would be wise to purchase the Scottish Bay's entire H3 references as TLD's, ahead of competing party.
Then select future regions of the world to ringfence H3/TLD's for use with this protocol.
The retail rate of co-ownership of the preceeding estate, should help towards this growing capital requirement, failing this investors maybe interested in financing this initiative.      

Moving forward the consortium will overlay the desired H3 grid onto a map of the Scottish Bay. 
A salesforce will sell the inventory to interested parties.
The lessor/lessee agreement will be as a cryptocurrency smart contract. 

A typical business case would see this estate divided into 2,800 honeycombs. 
 a) In this example a capital investor purchases co-ownership of a quarter of this estate (700 H3 hexagons) for circa $350,000 USD ($500 per honeycomb). 
 b) The first lessee is the aformentioned mesh network, which takes say 3 years to construct and begins earning in the region of $6M USD per annum for use/enjoyment of the protocol.
 c) The benefactor which co-owns a quarter of the estate would receive $750,000 USD per annum in royalties.
 d) At this juncture the currency invested would be USD but the currency generated by the network and paid to beneficiaries would be the cryptocurrency DOT (on the Polkadot blockchain).   

The interface for configuring the final phase of deployment of the domes is HotspotBnB. A simple localhost webapp, developed by the DATRO Consortium. 
HotspotBnB features a built in appstore which supports 'one-click' install of a variety of software (including DApps) for uniformity and scaliability.
HotspotBnB is ultimately just a webserver designed to run on a low energy/ low cost single board computers e.g. Raspberry Pi.
The operating system autonomously self-builds and configures. And can do so without an active internet connection (using another DATRO solution called Cacher)

DATRO is soon to release a self-service website for making customisations to this autonomous self-buiding OS prior downloading a copy (websites are also all accessible offline via Cacher)
HotspotBnB can be used as a residential wireless IoT Home Server if the end-user enters their wireless router SSID and password before generating their copy of the OS. 
HotspotBnB can also be used to manage a Geodesic Equipment Room if the physical location (in H3/ resolution 8 format) is pre-selected in order to include the H3-TLD inside the OS.
Now when HotspotBnB is booted up (providing an active internet exists or Cacher is used to simulate internet) it can identify itself and pair to other equipment rooms in its proximity.    


Justification
~~~~~~~~~~~~~~~

This protocol is justified from both a technical and business standpoint. 
The alternatives aren't half as effective and have limitations which this protocol overcomes. 
Furthermore this is a new generation of communications network and so a new protocol has had to be developed specifically because the existing technologies didn't suffice.
The Bloculus protocol is designed for a reality of automation, decentralization, anonymity, cryptographic security, currency and tokenized voting/ liquid democracy.


Annexures
~~~~~~~~~~~~

A suppliment or appendix to a written document. An annexure is an addition to something, often to a document. 
When used generally to simply mean something added, annexure is interchangeable with annex. More commonly used in Britain and India, where it often specifically refers to an addition to an official document. 

