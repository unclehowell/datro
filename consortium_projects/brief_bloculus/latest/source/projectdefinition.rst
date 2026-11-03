Project Definition
====================


Background information
~~~~~~~~~~~~~~~~~~~~~~~~
Bloculus was first written in 2021 for a coastal community network. This edition moves the pilot to the Cedwyn estate (Llandough and Leckwith, south-east of the river Ely), whose record is kept at cedwyn.bucklerfamily.estate.


Business Objective
~~~~~~~~~~~~~~~~~~~~
One stable, public, location-bearing reference and web address for each of the estate's 59 numbered land parcels.


Benefits and Limitations
~~~~~~~~~~~~~~~~~~~~~~~~~~
Benefits: maps, webapps, signs and devices share one reference per parcel; content can be pinned to the ground; the layout can be re-used for the planned replica in Patagonia.
Limitations: H3 hexagons do not follow field boundaries, so a cell marks a parcel's centre, not its shape; parcel geometry is approximate until traced and sourced.


Option Identification & Selection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Options considered: postcodes (too coarse, not stable for open land), National Grid references (square, not hierarchical by area), What3Words-style words (proprietary), H3 (public, hierarchical, equal-neighbour hexagons). Selected: H3, resolution 11 for parcel centres (proposal).


Scope, Impact, and interdependencies
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
In scope: the 59 parcels, their centre points and cells, the parcel record, and the sub-domain proposal. Depends on the estate plan being traced over modern mapping and on the Cedwyn site's 2D and 3D maps.


Outline Plan
~~~~~~~~~~~~~~~
1. Trace parcels and record centre points with sources and tolerances. 2. Compute cells and publish the parcel record. 3. Draw the estate maps from the record. 4. Propose and then add parcel sub-domains. 5. Pin content to cells.


Market Assessment
~~~~~~~~~~~~~~~~~~~~
Not assessed for this pilot; no prices are proposed.


Risk Assessment
~~~~~~~~~~~~~~~~~
Approximate geometry (mitigation: every cell names its source and tolerance); certificate coverage for two-level sub-domains (mitigation: arrange before going live); privacy (mitigation: publish only what the Cedwyn site already shows).


Project Approach
~~~~~~~~~~~~~~~~~~~
Small, verifiable steps on the existing static sites; each step published as a new semantic version of this brief.


Purchasing Strategy
~~~~~~~~~~~~~~~~~~~~~
None. Any purchase would first be listed as a proposal under Finance.
