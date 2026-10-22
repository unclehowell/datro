#!/usr/bin/env python3
"""oldbill v2 — the draft damages schedule: who GAINED (upper comb) and what the family LOST (lower comb).
Every figure is computed here from stated inputs; build.py imports this module, writes data/damages.json,
and posts the loss heads (mid) to the double-entry ledger. Index values were read on 22 Oct 2026:
ONS CDKO (composite price index, annual), ONS D7BT (CPI), UK HPI (HM Land Registry) Vale of Glamorgan."""
WIKI = 'https://greathousefarmwiki.wordpress.com'
def src(title, url=None): return {'title': title, 'url': url}

# ---------- sources ----------
S = dict(
  d5298=src('Damages, Losses & Costs Quantification (wiki page 5298)', WIKI + '/project-management/damages/'),
  d5475=src('Reparations Schedule & Proposed Apportionment (wiki page 5475)', WIKI + '/project-management/damages/reparations-schedule/'),
  ev0080=src('EV-0080 — BP Properties Ltd v Buckler [1987] EWCA Civ 2', WIKI + '/evidence/ev-0080-bp-properties-v-buckler-judgment/'),
  bailii=src('BP Properties Ltd v Buckler [1987] EWCA Civ 2 (BAILII)', 'https://www.bailii.org/ew/cases/EWCA/Civ/1987/2.html'),
  ev0288=src('EV-0288 — 1968–69 takeover of Western Ground Rents by BP (press)', WIKI + '/evidence/ev-0288-snippets-only-press-on-the-1968-69-takeover-battle-for-western-ground-rents-ltd-en/'),
  ev0276=src('EV-0276 — Ideal Homes (Wales) built Church View Close; Persimmon bought Ideal Homes in 1996', WIKI + '/evidence/ev-0276-churchview-close-llandough-ideal-homes-persimmon-1994-1996/'),
  ev0293=src('EV-0293 — 1994 cemetery excavation “on behalf of Ideal Homes Wales”, 1,026 burials', WIKI + '/evidence/ev-0293-llandough-1994-cemetery-excavation-her-ggat02272s-museum-wales-95-56h-burial-631/'),
  ev0290=src('EV-0290 — South Wales Echo, 2 Jun 1990: “Billy died suddenly this week”', WIKI + '/evidence/ev-0290-snippet-only-south-wales-echo-2-jun-1990-p-2-billy-died-suddenly-this-week-he-made/'),
  ev0274=src('EV-0274 — Probate calendar 1991', WIKI + '/evidence/ev-0274-probate-calendar-1991-william-beverley-buckler/'),
  n13=src('Press: “From farm to a bus” (N13, 1989)', WIKI + '/evidence-library/ghf-e090-n13-from-farm-to-a-bus-1989/'),
  n14=src('Press: “Angry scenes as farmer evicted” (N14, 1988)', WIKI + '/evidence-library/press-archive-transcripts/n14-1988-angry-scenes-as-farmer-evicted/'),
  demo=src('1988: Possession and Demolition', WIKI + '/demolition-1988/'),
  testimony=src('Legal Wiki — Testimony (GHF-E114)', WIKI + '/testimony/'),
  ppd=src('HM Land Registry Price Paid: Church View Close, Penarth', 'https://landregistry.data.gov.uk/app/ppd/?street=CHURCH+VIEW+CLOSE&town=PENARTH'),
  hpi=src('UK House Price Index: Vale of Glamorgan', 'https://landregistry.data.gov.uk/app/ukhpi/browse?location=http%3A%2F%2Flandregistry.data.gov.uk%2Fid%2Fregion%2Fvale-of-glamorgan'),
  cpi=src('ONS CPI index D7BT (the series behind the Bank of England inflation calculator)', 'https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7bt/mm23'),
  cdko=src('ONS composite price index CDKO (from 1800)', 'https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/cdko/mm23'),
  vct=src('Vale of Glamorgan Council: 2025/26 council tax bands (Llandough)', 'https://www.valeofglamorgan.gov.uk/Documents/Our%20Council/Council%20Tax%20&%20Benefits/CTAX-2025-26/2025-26-Council-Tax-Bands.pdf'),
  jcg=src('Judicial College Guidelines for the Assessment of General Damages in Personal Injury Cases, 17th ed. (2024)', 'https://uk.practicallaw.thomsonreuters.com/Browse/Home/Books/Judicial'),
  faa=src('Fatal Accidents Act 1976 s.1A (bereavement £15,120, SI 2020/316)', 'https://www.legislation.gov.uk/ukpga/1976/30/section/1A'),
  ppg=src('Planning Practice Guidance: Viability, para 018 (developer return 15–20% of GDV)', 'https://www.gov.uk/guidance/viability'),
  ramzan=src('Ramzan v Brookwide Ltd [2011] EWCA Civ 985 (exemplary £60,000)', 'https://www.bailii.org/ew/cases/EWCA/Civ/2011/985.html'),
  thompson=src('Thompson v Commissioner of Police [1998] QB 498 (aggravated and exemplary bands)', 'https://www.bailii.org/ew/cases/EWCA/Civ/1997/3083.html'),
  counting=src('The Counting House — public accounts', 'https://accounts.bucklerfamily.estate/'),
  brief=src('Ty Mawr Restitutionary Brief v3 (Feb 2026, superseded), IV.A'),
  takhar=src('Takhar v Gracefield Developments Ltd [2019] UKSC 13', 'https://www.bailii.org/uk/cases/UKSC/2019/13.html'),
)

# ---------- index values (read 22 Oct 2026) ----------
IDX = dict(
  cdko_1938=16.8, cdko_1969=68.7, cdko_2026=1665.2,          # ONS CDKO, annual 1938/1969, Sep 2026
  cpi_1989=52.2, cpi_1991=60.1, cpi_dec1993=64.7, cpi_1996=68.8, cpi_2011=93.4, cpi_now=144.1,  # ONS D7BT, Sep 2026
  hpi_vale_jan1995=17.5, hpi_vale_jul2026=106.1,              # UK HPI, Vale of Glamorgan (series starts Jan 1995)
)
def x(a, b): return IDX[b] / IDX[a]
def r0(v): return int(round(v))

# Bank Rate annual averages Dec 1988 – Oct 2026 (Bank of England series IUDBEDR, rounded; 2026 to Oct): estimate of the period mean
BANK = [13.6,14.0,14.5,11.7,9.6,6.0,5.5,6.7,6.0,6.6,7.2,5.3,6.0,5.1,4.0,3.7,4.4,4.6,4.6,5.5,4.7,0.6,0.5,0.5,0.5,0.5,0.5,0.5,0.4,0.3,0.6,0.75,0.2,0.1,1.5,4.7,5.1,4.3]
BANK_MEAN = round(sum(BANK) / len(BANK), 2)
YEARS_SINCE_1988 = round((2026 + 9.7 / 12) - (1988 + 11.2 / 12), 2)   # 6 Dec 1988 to 22 Oct 2026

# ---------- base facts ----------
GDV_16 = 1934496.0                 # 16 recorded new-build sales Feb 1995 – Apr 1997 (Price Paid; oldbill ledger notes)
MEAN_SALE = GDV_16 / 16            # £120,906
GDV_20 = 20 * MEAN_SALE            # 20 houses built; 4 not in Price Paid, carried at the mean (estimate)
WGR_COST_1938 = 5500.0             # Bute estate auction, 1938 (Brief v3, I.B; brief chronology "Yes")
WGR_VALUE_1969 = WGR_COST_1938 * x('cdko_1938', 'cdko_1969')   # held its money value to 1969
VALE_DETACHED = 539042.0           # page 5298 line 1d

# ---------- PARTIES ----------
PARTIES = {
 'BP':   dict(name='BP Properties Ltd / BP Pension Trust (now BP plc)', short='BP', colour='#2fbf71', gainer=True,
              route='Letter before claim; set the 1987 judgment aside (Takhar v Gracefield, the gateway); deceit, trespass and mesne profits, unjust enrichment / account of profits; s.32 Limitation Act 1980 if concealment is shown.'),
 'DEV':  dict(name='Ideal Homes (Wales), now Persimmon Homes', short='Developer', colour='#ffb347', gainer=True,
              route='Mesne profits for 1993–95 possession (trespass); unjust enrichment. An innocent purchaser for value is protected (Limitation Act 1980 s.32(3)).'),
 'WGR':  dict(name='Western Ground Rents Ltd (and successors)', short='Western Ground Rents', colour='#9ad1ff', gainer=True,
              route='Mary\u2019s estate (Law Reform (Miscellaneous Provisions) Act 1934); negligence in the 1953–55 proceedings and their enforcement; s.32 if concealment is shown.'),
 'HMLR': dict(name='HM Land Registry', short='HMLR', colour='#c3a6ff', gainer=True,
              route='Indemnity for a register mistake (Land Registration Act 2002 Sch 8); rectification (Sch 4); Independent Complaints Reviewer (ICR/090/26).'),
 'VALE': dict(name='Vale of Glamorgan Council', short='Vale Council', colour='#4dd0e1', gainer=True,
              route='Negligence in planning and conservation duties; Human Rights Act 1998 / A1P1 for acts after 2 Oct 2000; Public Services Ombudsman for Wales.'),
 'WG':   dict(name='Welsh Government / Cadw', short='WG / Cadw', colour='#e9e3ff', gainer=False,
              route='Negligence in the 1988 listing process; Human Rights Act 1998 / A1P1 for acts after 2 Oct 2000; Public Services Ombudsman for Wales.'),
 'SWP':  dict(name='South Wales Police', short='SWP', colour='#e9e3ff', gainer=False,
              route='Trespass to the person and misfeasance in public office (1988); IOPC complaint route.'),
 'SOL':  dict(name='The family\u2019s former solicitors (1986–87)', short='Former solicitors', colour='#e9e3ff', gainer=False,
              route='Professional negligence; 15-year longstop (Limitation Act 1980 s.14B) unless s.32 applies.'),
}

def tri(lo, mid, hi): return {'low': r0(lo), 'mid': r0(mid), 'high': r0(hi)}

# ---------- GAINS (upper comb): institutions and companies only ----------
def gains():
    G = []
    # Western Ground Rents
    nominal = WGR_VALUE_1969 - WGR_COST_1938
    G.append(dict(id='G-WGR', party='WGR', label='Western Ground Rents', what='The reversion, bought at auction in 1938 and sold to BP in 1969',
      v=tri(0, nominal * x('cdko_1969', 'cdko_2026'), nominal * x('cdko_1969', 'cdko_2026')), estimate=True,
      method='Price realised in 1969 minus the 1938 cost, carried to 2026 £ by the ONS composite price index. The farm\u2019s share of BP\u2019s 1969 bid for the whole company (about £18–19m) is not separable, so the 1969 value is the 1938 price held at its money value (estimate). Low: no gain in real terms. Rents for 1938–53: £ not on the record yet.',
      inputs=[('1938 auction price', '£5,500'), ('CDKO 1938 → 1969', f"{IDX['cdko_1938']} → {IDX['cdko_1969']} (×{x('cdko_1938','cdko_1969'):.2f})"),
              ('1969 value (estimate)', f'£{WGR_VALUE_1969:,.0f}'), ('Nominal gain 1969', f'£{nominal:,.0f}'), ('CDKO 1969 → Sep 2026', f"×{x('cdko_1969','cdko_2026'):.2f}")],
      facts=[('1938: Bute sold the reversion at auction for £5,500 to Western Ground Rents Ltd.', S['brief']),
             ('15 Feb 1969: BP made an agreed cash bid of 17s a share, about £18–19 million, to pass the company\u2019s properties to its pension fund.', S['ev0288']),
             ('1955 and 1962: possession orders were obtained while it held the reversion.', S['ev0080'])],
      sources=[S['ev0288'], S['cdko'], S['brief']]))
    # BP
    cost = WGR_VALUE_1969
    lo = (GDV_20 * .20 - cost) * x('cpi_dec1993', 'cpi_now'); mid = (GDV_20 * .25 - cost) * x('hpi_vale_jan1995', 'hpi_vale_jul2026'); hi = (GDV_20 * .33 - cost) * x('hpi_vale_jan1995', 'hpi_vale_jul2026')
    G.append(dict(id='G-BP', party='BP', label='BP', what='Land value realised: possession in 1988, sale to Ideal Homes on 3 Dec 1993',
      v=tri(lo, mid, hi), estimate=True,
      method='Price realised minus acquisition, uplifted to 2026. The Dec 1993 price is not on the record, so it is taken as the land share of the houses\u2019 sale value (residual method, 20% / 25% / 33% as on page 5298) less the 1969 acquisition value. Low is uplifted by CPI (money value); mid and high by the Vale of Glamorgan HPI (land value).',
      inputs=[('Sale value of the 20 houses, 1995–97', f'£{GDV_20:,.0f} (16 recorded sales, mean £{MEAN_SALE:,.0f}; 4 at the mean)'),
              ('Land share low / mid / high', '20% / 25% / 33%'), ('Less 1969 acquisition value (estimate)', f'£{cost:,.0f}'),
              ('CPI Dec 1993 → Sep 2026', f"×{x('cpi_dec1993','cpi_now'):.2f}"), ('Vale HPI Jan 1995 → Jul 2026', f"{IDX['hpi_vale_jan1995']} → {IDX['hpi_vale_jul2026']} (×{x('hpi_vale_jan1995','hpi_vale_jul2026'):.2f})")],
      facts=[('31 Jul 1987: the Court of Appeal gave BP Properties Ltd possession.', S['ev0080']),
             ('29/30 Nov 1988: the family was evicted; demolition followed in early Dec 1988.', S['demo']),
             ('3 Dec 1993: BP transferred the site to Ideal Homes (Wales).', S['d5298']),
             ('16 new houses sold Feb 1995 – Apr 1997 for £1,934,496.', S['ppd'])],
      sources=[S['d5298'], S['ppd'], S['hpi'], S['cpi']]))
    # Developer
    up = x('cpi_1996', 'cpi_now')
    G.append(dict(id='G-DEV', party='DEV', label='Developer', what='Margin on the houses built and sold at Church View Close, 1995–97',
      v=tri(GDV_16 * .10 * up, GDV_20 * .15 * up, GDV_20 * .20 * up), estimate=True,
      method='Standard housebuilder margin on sale value (GDV), after land and build cost: 10% low (16 recorded sales only), 15% mid and 20% high (20 houses), the range Planning Practice Guidance treats as a normal developer return. The land cost is BP\u2019s share above, already inside the other 80–90%. Carried to 2026 £ by CPI (1996 → Sep 2026).',
      inputs=[('Recorded sales, 16 houses', f'£{GDV_16:,.0f}'), ('20 houses at the mean', f'£{GDV_20:,.0f}'), ('Margin low / mid / high', '10% / 15% / 20% of GDV'), ('CPI 1996 → Sep 2026', f'×{up:.2f}')],
      facts=[('Ideal Homes (Wales) built Church View Close; first buyers by Jan 1995.', S['ev0276']),
             ('Persimmon bought Ideal Homes in early 1996 and sold the last house by Sep 1996.', S['ev0276']),
             ('The 1994 cemetery excavation was carried out on behalf of Ideal Homes Wales.', S['ev0293'])],
      sources=[S['ev0276'], S['ppd'], S['ppg'], S['cpi']]))
    # HMLR
    apps = 2 + 1 + 1 + 32 + 4
    G.append(dict(id='G-HMLR', party='HMLR', label='HMLR', what='Registration fees on the land, 1982 – 2026',
      v=tri(apps * 80, apps * 150, apps * 300), estimate=True,
      method=f'Applications on the record × a typical fee per application in 2026 £ (£80 / £150 / £300): 2 first registrations (1982, 1983), the 1987 amalgamation, the 1993 transfer, 32 sales in Price Paid and 4 new-build sales not in it = {apps}. HMLR\u2019s larger exposure is its statutory indemnity (in the table below), not its fees.',
      inputs=[('Applications', str(apps)), ('Fee per application, 2026 £', '£80 / £150 / £300 (estimate)')],
      facts=[('HMLR registered BP\u2019s titles WA231076 (30 Nov 1982) and WA240304 (23 Feb 1983) and amalgamated them on 2 Feb 1987.', S['d5475']),
             ('Price Paid lists 32 sales on Church View Close.', S['ppd'])],
      sources=[S['d5475'], S['ppd']]))
    # Vale
    band_f = 1405.56 * 13 / 6
    ct = 19 * 30 * band_f
    plan = 2500 * x('cpi_1991', 'cpi_now')
    G.append(dict(id='G-VALE', party='VALE', label='Vale Council', what='Planning fees (1989, 1992) and council tax on the new houses since 1996',
      v=tri(0, ct * .80 + plan, ct + plan), estimate=True,
      method='Council tax: 19 extra dwellings (20 houses less the one farmhouse) × 30 years (1996/97 – 2025/26) × the 2025/26 Llandough Band F charge (estimate of band), in 2026 £. Mid takes the council\u2019s own element (80%, estimate); high adds the police and community precepts. Council tax pays for services, so low is nil: this tooth measures revenue the houses brought in, not a sum to recover. Planning fees for 89/01396/OUT and 92/00671/RES: about £2,500 (estimate), CPI to 2026.',
      inputs=[('2025/26 Llandough Band A', '£1,405.56'), ('Band F = A × 13/6', f'£{band_f:,.2f}'), ('Extra dwellings × years', '19 × 30'), ('Council element (mid)', '80% (estimate)'), ('Planning fees, 2026 £', f'£{plan:,.0f}')],
      facts=[('Planning permissions 89/01396/OUT and 92/00671/RES for housing on the site.', S['d5475']),
             ('Mar 1992: full permission granted with no archaeological condition.', S['brief'])],
      sources=[S['vct'], S['d5475'], S['cpi']]))
    for g in G:
        g['party_name'] = PARTIES[g['party']]['name']; g['colour'] = PARTIES[g['party']]['colour']
    return G

# ---------- LOSSES (lower comb) ----------
def jc(lo16, hi16): return (round(lo16 * 1.22, -1), round(hi16 * 1.22, -1))
PSY = {'less': (1880, 7150), 'moderate': (7150, 23270), 'modsev': (23270, 66920), 'severe': (66920, 141240)}   # JCG 17th ed., ch.4(A)
BK = jc(91950, 124800); AK = jc(98380, 129010)   # JCG 16th ed. ch.7 leg amputation brackets + 22% (the 17th ed. uplift)
def mp(b): return (b[0] + b[1]) / 2

def losses(G):
    gmid = {g['party']: g['v']['mid'] for g in G}
    L = []
    def add(**k): L.append(k)
    add(id='L-LAND', label='Home & land', head='The farmhouse and the land (Parcel A, about 10 acres)', v=tri(621000, 2809000, 4096000),
        alloc={'BP': 60, 'HMLR': 25, 'DEV': 10, 'SOL': 5}, estimate=True,
        method='Market value today, HPI-uplifted (page 5298 Head 1). Low: existing-use value: the Vale detached-house average (£539,042, Jul 2026) plus 10 acres at £8,200/acre. Mid / high: the land share (25% / 33%) of the developed value today (20 houses × £551,929 / £605,565) plus the woodland and green at farmland rates.',
        inputs=[('Vale detached average, Jul 2026', '£539,042'), ('House value today, mid / high', '£551,929 / £605,565'), ('Land share mid / high', '25% / 33%')],
        facts=[('The Court of Appeal gave possession to BP Properties Ltd on 31 Jul 1987.', S['ev0080']), ('The house was demolished from 6 Dec 1988.', S['demo']), ('20 houses now stand on the site.', S['ppd'])],
        legal='Restitution of the land or its value; deceit (Smith New Court v Scrimgeour Vickers [1997] AC 254) once the 1987 judgment is set aside; indemnity (LRA 2002 Sch 8).',
        sources=[S['d5298'], S['ev0080'], S['ppd']])
    add(id='L-USE', label='Loss of use', head='Loss of use and mesne profits, Dec 1988 – Oct 2026', v=tri(308800, 340300, 425400),
        alloc={'BP': 70, 'HMLR': 20, 'DEV': 10}, estimate=True,
        method='Rental value × years since 1988: the Vale market rent (ONS, Aug 2026) back-cast year by year with the Wales HPI, summed Dec 1988 – Oct 2026 (page 5298 line 2b).',
        inputs=[('Period', 'Dec 1988 – Oct 2026 (about 38 years)'), ('Rent today', 'ONS private rents, Vale of Glamorgan, Aug 2026')],
        facts=[('Dispossession on 29/30 Nov 1988.', S['demo']), ('BP in possession to 3 Dec 1993, then Ideal Homes.', S['d5298'])],
        legal='Trespass and mesne profits at the ordinary letting value (Inverugie Investments v Hackett [1995] 1 WLR 713); Limitation Act 1980 s.2, extended by s.32 if concealment is shown.',
        sources=[S['d5298']])
    add(id='L-CONT', label='Contents', head='Contents lost with the demolition', v=tri(30000, 30000, 30000),
        alloc={'BP': 90, 'SWP': 10}, estimate=False,
        method='William\u2019s own figure in 1989: about £30,000 (press cutting N13), taken at its 1988 value. Interest on it is in the interest head.',
        inputs=[('Figure', '£30,000 (1989)')], facts=[('“From farm to a bus”: William put the loss of contents at about £30,000.', S['n13'])],
        legal='Conversion and trespass to goods (Torts (Interference with Goods) Act 1977).', sources=[S['n13'], S['demo']])
    lo = 5 * PSY['moderate'][0]; mid = 2 * mp(PSY['modsev']) + 3 * mp(PSY['moderate']); hi = 2 * PSY['severe'][0] + 3 * mp(PSY['modsev'])
    add(id='L-DIST', label='Distress', head='Distress and psychiatric injury: William, his partner and three children', v=tri(lo, mid, hi),
        alloc={'BP': 75, 'SWP': 10, 'HMLR': 5, 'VALE': 5, 'WG': 5}, estimate=True,
        method='Judicial College Guidelines (17th ed.), psychiatric damage generally. Low: 5 × the foot of the moderate bracket. Mid: 2 adults at the middle of moderately severe + 3 children at the middle of moderate. High: 2 adults at the foot of severe + 3 children at the middle of moderately severe.',
        inputs=[('Moderate', '£7,150 – £23,270'), ('Moderately severe', '£23,270 – £66,920'), ('Severe', '£66,920 – £141,240'), ('People', '5 (two adults, three children aged two to four in 1988)')],
        facts=[('29 Apr 1988: an axe came through a door with the children behind it.', S['d5298']), ('Nov 1988: the householder was injured in the eviction and taken to Llandough Hospital.', S['n14']),
               ('A pregnant family member was put over the farm gate by the removal team; her shoulder was dislocated.', S['testimony'])],
        legal='Trespass to the person and to land; damages for psychiatric injury (primary victims); Human Rights Act 1998 Art 8 only for acts after 2 Oct 2000.',
        sources=[S['jcg'], S['testimony'], S['n14']])
    add(id='L-AMP', label='Mary\u2019s leg', head='Mary Williams: leg amputation (c.1955)', v=tri(0, mp(BK), AK[1]),
        alloc={'WGR': 100}, estimate=True, causation='to be proven',
        method=f'The family\u2019s account: the stress of the first eviction dispute (notice 1953, order 1955) brought on the amputation. Judicial College Guidelines bracket for amputation of one leg (16th ed. +22%, the 17th ed. uplift): below-knee £{BK[0]:,.0f} – £{BK[1]:,.0f}, above-knee £{AK[0]:,.0f} – £{AK[1]:,.0f}. Low nil (causation not established); mid the middle of below-knee; high the top of above-knee. Causation: to be proven by medical records and expert evidence.',
        inputs=[('Below-knee bracket', f'£{BK[0]:,.0f} – £{BK[1]:,.0f}'), ('Above-knee bracket', f'£{AK[0]:,.0f} – £{AK[1]:,.0f}'), ('Causation', 'to be proven')],
        facts=[('The 1987 judgment records that when the 1955 order was enforced on 4 July 1955, Mrs Buckler “had recently come out of hospital after having had a leg amputated and was objecting very strongly to leaving the farmhouse”, with a fear she might attempt suicide.', S['ev0080']),
               ('The family\u2019s account links the amputation to the stress of the dispute.', S['d5475']), ('Mary died in March 1983.', S['d5475'])],
        legal='Personal injury through Mary\u2019s estate (Law Reform (Miscellaneous Provisions) Act 1934); negligence or harassment in the 1953–55 proceedings; s.32 if concealment is shown.',
        sources=[S['ev0080'], S['bailii'], S['d5475'], S['jcg']])
    dep = (2 / 3) * 15000 * 15 * x('cpi_1991', 'cpi_now')
    add(id='L-DEATH', label='Deaths', head='Wrongful death: the estates of Mary (d. 1983) and William “Billy” Buckler (d. 1990)', v=tri(0, 15120 + 2 * 4500, 15120 + 2 * 4500 + dep),
        alloc={'BP': 70, 'WGR': 30}, estimate=True, causation='to be proven',
        method=f'Fatal Accidents Act 1976: the statutory bereavement award (£15,120) for William\u2019s widow, plus two funerals at about £4,500 each today (estimate). High adds dependency for William\u2019s partner and three children: 2/3 of an assumed £15,000 net a year × 15 years to the children\u2019s majority, carried to 2026 £ by CPI (£{dep:,.0f}; earnings not on the record yet). Low nil (causation not established). Causation: to be proven.',
        inputs=[('Bereavement award', '£15,120'), ('Funerals', '2 × £4,500 (estimate)'), ('Dependency (high only)', f'£{dep:,.0f} (estimate)')],
        facts=[('Mary died in March 1983.', S['d5475']), ('South Wales Echo, 2 Jun 1990: “Billy died suddenly this week”.', S['ev0290']), ('Probate calendar 1991: William Beverley Buckler, died 29 April 1990 (probable match).', S['ev0274'])],
        legal='Fatal Accidents Act 1976 ss.1A, 3; Law Reform (Miscellaneous Provisions) Act 1934 for the estates; causation by medical evidence.',
        sources=[S['faa'], S['ev0290'], S['ev0274'], S['d5475']])
    ex_mid = 60000 * x('cpi_2011', 'cpi_now'); ex_hi = 0.15 * gmid['BP']
    add(id='L-AGG', label='Aggravated', head='Aggravated and exemplary damages: the 1988 eviction and demolition', v=tri(5 * 5000, 5 * 15000 + ex_mid, 5 * 25000 + ex_hi),
        alloc={'BP': 85, 'SWP': 15}, estimate=True,
        method=f'Aggravated: £5,000 / £15,000 / £25,000 per person × 5 (Thompson v Commissioner of Police bands, indexed). Exemplary: nil low; mid the £60,000 award in Ramzan v Brookwide (2011) carried to 2026 £ by CPI (£{ex_mid:,.0f}); high 15% of BP\u2019s mid gain (£{ex_hi:,.0f}), because category 2 is measured against the profit (Rookes v Barnard [1964] AC 1129).',
        inputs=[('People', '5'), ('Ramzan exemplary, 2026 £', f'£{ex_mid:,.0f}'), ('BP mid gain × 15%', f'£{ex_hi:,.0f}')],
        facts=[('Five bailiffs and about 20 police attended; three young children were present; a pregnant family member was put over the gate.', S['testimony']), ('Demolition began within hours, while a High Court interim injunction covered the farmhouse and its contents.', S['demo'])],
        legal='Rookes v Barnard [1964] AC 1129 (category 2: conduct calculated to profit); Kuddus v Chief Constable [2001] UKHL 29; Archer v Brown [1985] QB 401.',
        sources=[S['thompson'], S['ramzan'], S['demo']])
    add(id='L-HER', label='Heritage', head='Heritage and archaeological loss: the medieval farmhouse and the 1994 cemetery', v=tri(0, 250 * 3500 - VALE_DETACHED, 300 * 4500 - VALE_DETACHED),
        alloc={'BP': 50, 'WG': 25, 'VALE': 15, 'DEV': 10}, estimate=True,
        method='Reinstatement premium: the cost of rebuilding a comparable historic farmhouse (250 m² at £3,500/m² mid; 300 m² at £4,500/m² high; floor area estimate) less its market value already in the land head (£539,042). Archaeology: no one owns human remains, so the 1,026 burials carry no money value; the finds (Museum Wales 95.56H) are a return-or-copy remedy in kind, £0 here.',
        inputs=[('Floor area (estimate)', '250 m² / 300 m²'), ('Rebuild rate (estimate)', '£3,500 / £4,500 per m²'), ('Less market value in the land head', '£539,042')],
        facts=[('3 Dec 1988: Cadw was considering an emergency spot-listing.', S['brief']), ('1994: the cemetery excavation recorded 1,026 burials, carried out on behalf of Ideal Homes Wales.', S['ev0293'])],
        legal='Damages for loss of the building at reinstatement cost where reinstatement is reasonable (Lodge Holes Colliery v Wednesbury [1908] AC 323 principle); delivery up of identified items.',
        sources=[S['ev0293'], S['d5475'], S['brief']])
    add(id='L-COST', label='Costs', head='Costs borne by the family', v=tri(6480 + 211.93, 12960 + 211.93, 25920 + 211.93),
        alloc={'BP': 80, 'HMLR': 20}, estimate=True,
        method='Litigant-in-person time at £24 an hour (CPR 46.5) × 270 / 540 / 1,080 hours (page 5298 line 8a), plus £211.93 of receipted cash. The costs of the 1955, 1962, 1974 and 1986–88 proceedings: £ not on the record yet.',
        inputs=[('Rate', '£24 an hour (CPR 46.5)'), ('Hours', '270 / 540 / 1,080'), ('Cash with receipts', '£211.93')],
        facts=[('Project cash to 20 Oct 2026: £211.93.', S['counting'])], legal='CPR 46.5 (litigant in person); a costs order in the claim.',
        sources=[S['d5298'], S['counting']])
    c_lo = 30000 * (BANK_MEAN + 1) / 100 * YEARS_SINCE_1988; c_mid = 30000 * .08 * YEARS_SINCE_1988
    add(id='L-INT', label='Interest', head='Interest on the loss of use and the contents', v=tri(156100 + c_lo, 459400 + c_mid, 459400 * 425400 / 340300 + c_mid),
        alloc={'BP': 75, 'HMLR': 15, 'DEV': 10}, estimate=True,
        method=f'Mid and high at 8% simple, the Judgments Act rate, on each year\u2019s loss of use from when it fell due (page 5298 line 4c: £459,400 on the mid rent; scaled to the high rent) and on the £30,000 contents from Dec 1988 ({YEARS_SINCE_1988} years). Low at Bank Rate +1% (s.35A Senior Courts Act 1981; mean Bank Rate {BANK_MEAN}%). No interest on the land head: its value is already carried to today by the HPI.',
        inputs=[('Rate, mid / high', '8% simple'), ('Rate, low', f'Bank Rate +1% (mean {BANK_MEAN + 1:.2f}%)'), ('Contents interest at 8%', f'£{c_mid:,.0f}')],
        facts=[('Page 5298 sets out the interest lines at Bank Rate, Bank Rate +1% and 8%.', S['d5298'])],
        legal='Senior Courts Act 1981 s.35A; Judgments Act 1838 (8%).', sources=[S['d5298']])
    for l in L:
        assert sum(l['alloc'].values()) == 100, l['id']
        l['maps_to'] = [p for p in l['alloc'] if PARTIES[p]['gainer']]
    return L

# ---------- Brief v3 scenario (Section IV.A only) ----------
BRIEF_HEADS = [
  ('Estate & Hope Value', 52500000, '70 acres × £750k/acre at prime regional development rates (1988 press record; Cardiff Bay uplift).', ['L-LAND', 'L-USE'],
   'The record holds about 10 acres (Parcel A); Parcel B (9 acres) and the woodland are not yet valued. The developed-land share today works out at about £276k an acre, against £750k in the brief.'),
  ('Restitutionary Disgorgement', 115000000, '35 years of cumulative benefit from development, ground rents and residential sales. Rukhadze / account of profits principle.', ['GAINS'],
   'An account of profits reaches the profits a party actually made from the land: the gains comb. It is the alternative to compensation, so it is shown beside the losses and never added to them.'),
  ('Historical & Manorial Restoration', 10000000, '13th-century grange + manorial lordship of Llandough + Marconi connection.', ['L-HER'],
   'Priced here at the reinstatement premium of the farmhouse. No lordship title document is on the record yet; heritage loss is mostly remedied in kind.'),
  ('Archaeological Expropriation', 5000000, '800+ burials, largest early-medieval site in Wales, 1870 Actual Notice.', [],
   'No one owns human remains in English law, so burials carry no money value; identified finds go back or are copied, a remedy in kind.'),
  ('Multi-Generational Trauma', 5000000, '~25 descendants; 35 years displacement; housing insecurity; loss of life chances.', ['L-DIST'],
   'The Judicial College brackets price recognised psychiatric injury for the five people present; descendants who were not there have no claim of their own under the secondary-victim rules (Alcock).'),
  ('Wrongful Death (estates)', 5000000, 'Deaths of Mary Williams and Billy Buckler.', ['L-DEATH', 'L-AMP'],
   'The Fatal Accidents Act gives a fixed bereavement award and dependency; with causation proven the two estates and Mary\u2019s amputation come to about £0.16m mid.'),
  ('Aggravated & Exemplary Damages', 3000000, '4am eviction; children present; pre-emptive demolition. Reduced per Rookes v Barnard [1964] HL.', ['L-AGG'],
   'Reported awards (Thompson, Ramzan) put this head in the low hundreds of thousands, rising toward the profit under Rookes category 2.'),
]

RECON = [
  'The analyst build-up is the working figure. Brief v3 (Feb 2026, superseded) was an earlier, outdated pricing and is kept only so the difference can be traced. The analyst build-up prices only what the record holds today, by the methods a court uses; the superseded brief priced the family\u2019s full case at development and restitution values. The gap between them is the evidence still to find.',
  'Land: the brief takes 70 acres at £750k an acre (£52.5m). The record so far holds about 10 acres (Parcel A); Parcel B and the woodland are still to be valued, and the developed-land share today comes to about £276k an acre. Every acre added to the record moves this head toward the brief.',
  'Disgorgement: the brief adds £115m of disgorgement on top of the losses. Disgorgement and compensation are alternatives: the family elects one measure against each party. The gains comb ({g_mid}) is the account-of-profits measure on the profits the record shows: BP\u2019s land value, the developer\u2019s margin, ground-rent and fee income.',
  'Heritage, archaeology, trauma, deaths and exemplary damages carry £28m in the brief and {soft_mid} here. Courts price these heads with the Judicial College brackets, the Fatal Accidents Act and reported awards; the brief\u2019s figures rest on restitution of cultural value and on 25 descendants, which those methods do not reach today.',
  'What closes the gap: title to the wider 70 acres, the real 1993 sale price and BP\u2019s accounts (for an account of profits), medical evidence on causation for Mary and William, and a setting-aside of the 1987 judgment, which opens the larger heads.',
]
BRIEF_RANGE = {'lo': 180000000, 'mid': 195500000, 'hi': 200000000}

def schedule():
    G = gains(); L = losses(G)
    tot = lambda xs, k: sum(i['v'][k] for i in xs)
    totals = {'gains': {k: tot(G, k) for k in ('low', 'mid', 'high')}, 'losses': {k: tot(L, k) for k in ('low', 'mid', 'high')}}
    # parallel table: one row per (party, loss head) from the allocations; disgorgement per party beside it
    rows = []
    for pk, p in PARTIES.items():
        for l in L:
            sh = l['alloc'].get(pk)
            if not sh: continue
            rows.append(dict(party=pk, party_name=p['name'], head=l['id'], what=l['head'], share=sh,
                             v={k: round(l['v'][k] * sh / 100) for k in ('low', 'mid', 'high')}, legal=l['legal'], route=p['route'],
                             causation=l.get('causation'), evidence=[s for s in l['sources'] if s.get('url')][:2]))
    by_party = {}
    for pk, p in PARTIES.items():
        comp = {k: sum(r['v'][k] for r in rows if r['party'] == pk) for k in ('low', 'mid', 'high')}
        g = next((g for g in G if g['party'] == pk), None)
        by_party[pk] = dict(name=p['name'], short=p['short'], colour=p['colour'], gainer=p['gainer'], route=p['route'], compensation=comp,
                            disgorgement=(g['v'] if g else None))
    brief = [dict(head=h, amount=a, basis=b, analyst=[i for i in m], gap_note=n,
                  analyst_mid=(totals['gains']['mid'] if m == ['GAINS'] else sum(l['v']['mid'] for l in L if l['id'] in m))) for h, a, b, m, n in BRIEF_HEADS]
    assert sum(b['amount'] for b in brief) == BRIEF_RANGE['mid']
    soft = sum(l['v']['mid'] for l in L if l['id'] in ('L-HER', 'L-DIST', 'L-DEATH', 'L-AMP', 'L-AGG'))
    fm = lambda v: ('£%.2fm' % (v / 1e6)).replace('.00m', 'm')
    recon_txt = [t.replace('{g_mid}', fm(totals['gains']['mid'])).replace('{soft_mid}', fm(soft)) for t in RECON]
    return dict(schema='oldbill-damages/1', reconciliation=recon_txt, parties=by_party, gains=G, losses=L, rows=rows, totals=totals,
                brief={'heads': brief, 'range': BRIEF_RANGE, 'source': S['brief']}, indices=IDX, bank_mean=BANK_MEAN,
                interest_rate='8% simple (Judgments Act 1838) mid and high; Bank Rate +1% low', sources=S)
