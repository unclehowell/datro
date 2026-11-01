Executive Summary
====================

The Cedwyn estate lies in Llandough and Leckwith, south-east of the river Ely, just outside Cardiff in south Wales.
Its record and chronology are kept at `cedwyn.bucklerfamily.estate <https://cedwyn.bucklerfamily.estate/>`__, which organises the estate as 59 numbered land parcels,
each with its own webapp (shown as "NN of 59").
This brief proposes the Cedwyn estate as the first pilot of the Bloculus protocol: every parcel's centre point is tied to one H3 hexagon reference,
and that reference becomes the parcel's address on the web.

Bloculus began in 2021 as a component of DATRO's community network work. This edition keeps its central idea, an addressing system in which the address
itself carries the physical location, and applies it to a real, bounded, well-documented piece of land.
The DATRO source code remains public under a General Public Licence, so anyone can run the same approach for their own place.

Statements about the estate in this brief are limited to what the Cedwyn site publishes. Everything else in it, the cell choices, the addresses and the pilot plan,
is a proposal.


Challenge
~~~~~~~~~~~
The pilot sets out to solve five problems:

	1. Every parcel, and every thing pinned to a parcel (a tour stop, a reconstruction, an archive record, a game object), needs one stable reference that is the same for people, maps and machines.

	2. That reference must resolve to the physical ground, so a phone standing in a field can find the content for that field, the way location games pin characters to real places.

	3. References must be short enough to travel over low-bandwidth links and to be typed, printed on a sign or encoded in a QR code.

	4. The same reference must group naturally into larger areas (parcel, farm, estate, parish) without a second system.

	5. The layout must be portable: the planned replica of the estate in Patagonia should be able to re-use the parcel layout while keeping its own real-world references.


Solution & Outcomes
~~~~~~~~~~~~~~~~~~~~~~~
The protocol is named Bloculus, a combination of two words:
 - 'Bloc', a reference to the blocks of a ledger and to blocks of land
 - 'Loculus', an architectural and biological word for a "little place" or compartment

Bloculus combines Uber's hexagonal ("H3") grid reference system with the domain name system.
The result is a web address for each hexagon's unique reference.
Addresses work first on a local network (on site, without internet), and resolve on the wider internet once a gateway exists.

There are many grid reference systems, for example the Ordnance Survey National Grid, Universal Transverse Mercator (UTM) and the Military Grid Reference System (MGRS).
H3 is unusual: instead of a point or a square it uses hexagons, often called "honeycombs". Each hexagon has neighbours at equal distances,
and each one splits into about seven smaller ones, so one family of references runs from continents down to a few square metres.
H3's "resolution" sets the honeycomb size. The resolutions that matter for Cedwyn are:


+----------------+-----------------------------+-----------------------------+----------------------------------+
| H3 Resolution  | Avg. Hexagon Area           | Avg. Edge Length            | Role in the Cedwyn pilot         |
+================+=============================+=============================+==================================+
| 8              | 0.737 km2                   | 531 m                       | estate and village scale         |
+----------------+-----------------------------+-----------------------------+----------------------------------+
| 9              | 0.105 km2                   | 201 m                       | farm and field groups            |
+----------------+-----------------------------+-----------------------------+----------------------------------+
| 10             | 15,048 m2                   | 76 m                        | large parcels                    |
+----------------+-----------------------------+-----------------------------+----------------------------------+
| 11             | 2,150 m2                    | 29 m                        | parcel centre point (proposed)   |
+----------------+-----------------------------+-----------------------------+----------------------------------+
| 12             | 307 m2                      | 11 m                        | buildings, tour stops, pins      |
+----------------+-----------------------------+-----------------------------+----------------------------------+

Figures are H3's published averages (H3 library 4.x). Each reference is a 15-character code.
For example, near the centre of Llandough village (an approximate point, within about 300 m) the references are:

 - resolution 8: ``8819586b39fffff``
 - resolution 9: ``8919586b393ffff``
 - resolution 11: ``8b19586b3923fff``

The 2021 edition chose resolution 8 (about 500 m honeycombs) to balance privacy and accuracy for network equipment rooms.
A land pilot needs finer cells. This brief proposes **resolution 11 for each parcel's centre point**: a hexagon of about 2,150 m2,
small enough to sit inside a typical field, large enough to stay stable when the traced centre point moves by a few metres.
Resolution 12 is kept for things pinned inside a parcel, such as a tour stop or a reconstruction anchor.
Because H3 is hierarchical, every parcel cell also names its resolution 9 and resolution 8 parents, so the farm and the estate fall out of the same codes.

Use of H3 references cannot be owned or controlled by anyone; they are a public grid. What can be held is the name that points to them.
The 2021 edition proposed one Handshake top-level domain per hexagon (for example ``.8843a13687fffff``).
Until a suitable top-level domain exists for the estate (for example ``.cedwyn``), the pilot uses sub-domains of ``bucklerfamily.estate``:

 - parcel: ``<resolution 11 cell>.cedwyn.bucklerfamily.estate``, with a readable alias ``p01.cedwyn.bucklerfamily.estate`` to ``p59.cedwyn.bucklerfamily.estate``
 - a service or layer on a parcel: ``<service>.<cell>.cedwyn.bucklerfamily.estate``, for example ``tour.<cell>.cedwyn.bucklerfamily.estate`` or ``archive.<cell>.cedwyn.bucklerfamily.estate``
 - later, with a dedicated top-level domain: ``<cell>.cedwyn`` and ``tour.<cell>.cedwyn``

These names are a proposal. None is registered or live yet; each will be added only when its parcel's centre point has a named source.

Because the address contains the location, a device on site can work out which parcel it stands in, look up that parcel's cell,
and open its content directly; services in neighbouring parcels can find each other by asking for the neighbouring cells.
A query for content in one place can start at the estate cell and narrow down through its children, the same triangulation idea the 2021 edition described for routing.


Pilot Model (proposal)
~~~~~~~~~~~~~~~~~~~~~~~~

The 2021 edition priced honeycombs for sale and modelled investor returns. This edition sets no prices and makes no financial projections.
The pilot is a public reference layer for one estate:

 - one record per parcel: parcel number (1 to 59), name, webapp, centre point (latitude and longitude), H3 cell at resolution 11, the source of the centre point and its tolerance
 - the 2D and 3D maps on the Cedwyn site draw parcels from that record, so the maps, the webapps and the addresses agree
 - content in each webapp (tour notes, records, reconstructions, games) is pinned to a cell, so it appears in the right place on the ground and on the map
 - the planned replica of the estate in Patagonia re-uses the parcel layout (parcel numbers and relative positions); its own cells are computed from its own planned site, and it is always labelled planned


Recommendation
~~~~~~~~~~~~~~~~~

 1. Trace the 59 numbered parcels from the historic estate plan over modern mapping, record each centre point with its source and tolerance, and compute its resolution 11 cell.
 2. Publish the parcel record as one data file on the Cedwyn site, and draw the 2D and 3D estate maps from it.
 3. Propose one sub-domain per parcel under ``cedwyn.bucklerfamily.estate`` and add them only once each centre point is sourced; arrange a certificate covering the second level first.
 4. Pin site content to cells (resolution 11 for parcels, resolution 12 for points inside them).
 5. Review the top-level domain question (for example ``.cedwyn``) once the pilot addresses are in use.


Justification
~~~~~~~~~~~~~~~

A bounded estate with numbered parcels is the right size to prove the protocol: small enough to finish, rich enough to test every layer
(land, buildings, routes, records, reconstructions and an overseas replica).
H3 gives one public, hierarchical reference that maps, phones and software all read the same way, and it does not change when a map is redrawn.
Putting the reference in the web address means a person, a printed sign and a machine all reach the same page for the same piece of ground.

The wider DATRO vision is unchanged: services hosted locally, reachable by place, working on a local network first and joining the internet through a gateway.
HotspotBnB, DATRO's self-building localhost web server, can carry a parcel's cell in its configuration so that a device placed on that parcel identifies itself and pairs with its neighbours.

Supporting Material
~~~~~~~~~~~~~~~~~~~~~

An annexure is a supplement to this document; see the Annexures chapter.
