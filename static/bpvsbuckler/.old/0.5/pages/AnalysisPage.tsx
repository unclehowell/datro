import React from 'react';
import Section from '../components/Section';
import { FileText, BookOpen } from 'lucide-react';

const AnalysisPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-block p-4 rounded-full bg-slate-800 mb-6">
            <BookOpen size={40} className="text-justice-red" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Case Analysis & Chronology</h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto font-serif leading-relaxed">
            Detailed examination of BP Properties Ltd v Buckler (1987), including the historical context, legal turning points, and the conflict between procedural law and substantive justice.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-1 gap-12">
          
          {/* Document 1: Legal Case Analysis and Chronology */}
          <div className="bg-white p-8 md:p-12 shadow-sm border border-slate-200 rounded-lg prose prose-slate max-w-none">
            <h2 className="text-3xl font-serif font-bold text-slate-900 border-b-4 border-justice-red pb-4 mb-8">
              Part I: Legal Case Analysis and Chronology
            </h2>
            
            <div className="bg-slate-50 p-6 rounded-lg mb-8 border-l-4 border-slate-400">
              <h3 className="text-xl font-bold mt-0 mb-4">Case Overview</h3>
              <ul className="list-none pl-0 space-y-2 text-sm">
                <li><strong>Case Name:</strong> BP Properties Ltd v Buckler</li>
                <li><strong>Year:</strong> 1987 (Court of Appeal decision)</li>
                <li><strong>Court:</strong> Court of Appeal (England and Wales)</li>
                <li><strong>Subject Matter:</strong> Adverse possession, agricultural tenancy, limitation periods</li>
                <li><strong>Property:</strong> Great House Farm, South Glamorgan, Wales</li>
                <li className="pt-2 italic"><strong>Central Legal Question:</strong> Whether the Buckler family acquired title to the farmhouse through adverse possession after ceasing to pay rent, or whether various legal actions by the landlords interrupted the limitation period.</li>
              </ul>
            </div>

            <h3 className="text-2xl font-serif font-bold text-slate-900 mt-12 mb-6">Chronological Timeline</h3>
            <div className="space-y-6">
                {[
                    { year: "1916", text: "Marquis of Bute granted tenancy of Great House Farm to John Williams. The Marquis retained the freehold reversion (landlord's interest)." },
                    { year: "1938", text: "Marquis of Bute conveyed the freehold reversion to Western Ground Rents Ltd. Western Ground Rents became the new landlord, establishing the chain of title leading to BP Properties." },
                    { year: "1949", text: "Frederick Buckler took over occupation of the property. He was married to Mary Buckler (daughter/granddaughter of John Williams)." },
                    { year: "1953", text: "Last rent payment made by the Bucklers (approximate date). Bucklers ceased acknowledging landlord's title." },
                    { year: "1955", text: "February 2: Frederick Buckler's agricultural tenancy formally terminated. Potentially the start date for adverse possession." },
                    { year: "1962", text: "December 11: Western Ground Rents obtained a County Court possession order against Frederick Buckler. Order obtained by consent or default (Order 14), not through a full trial. The order was not immediately enforced and remained valid for 12 years (until December 1974)." },
                    { year: "1965", text: "March: Frederick Buckler complained to Western Ground Rents that they had \"refused to let him the land\". This statement later undermined claims of adverse possession intent." },
                    { year: "1965-67", text: "Frederick Buckler died. Mrs. Mary Buckler continued in occupation. If adverse possession began in 1953, title should have extinguished in 1965." },
                    { year: "1969", text: "Western Ground Rents sold the property to BP Pension Trust. If the Bucklers' adverse possession claim was valid, Western Ground Rents may have sold property they no longer owned." },
                    { year: "1974", text: "September 19: Judge Watkin Powell ordered that possession warrant could be issued but not executed until October 31, 1974. Six-week grace period granted due to Mrs. Buckler's circumstances." },
                    { year: "1974", text: "October 30: Mrs. Buckler's solicitors issued notice of appeal. October 31: BP Properties sent two letters offering Mrs. Buckler a lifetime licence to remain. The letters were sent unilaterally." },
                    { year: "1974-83", text: "Mrs. Mary Buckler remained in occupation. She never expressly accepted or rejected the October 31, 1974 licence offer." },
                    { year: "1982", text: "BP Properties registered their title to the property." },
                    { year: "1983", text: "Mrs. Mary Buckler died. Her son, Mr. W. Buckler (Junior), continued in occupation." },
                    { year: "1986", text: "BP Properties initiated possession proceedings against Mr. W. Buckler (Junior)." },
                    { year: "1987", text: "Court of Appeal decision. Ruled in favor of BP Properties. Held that the 1962 possession order tolled the limitation period and the 1974 letters created a licence." }
                ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                        <span className="font-bold text-justice-red w-24 shrink-0">{item.year}</span>
                        <p className="m-0 text-slate-700">{item.text}</p>
                    </div>
                ))}
            </div>

            <h3 className="text-2xl font-serif font-bold text-slate-900 mt-12 mb-6">The Buckler Family's Position</h3>
            <p><strong>Primary Legal Claim:</strong> Ownership by Adverse Possession (1965-1967). Adverse possession began no later than February 2, 1955. Under the Limitation Act 1939, 12 years of adverse possession extinguishes the paper owner's title.</p>
            <p><strong>Secondary Legal Claim:</strong> Ownership by Alternative Date (1977-1979). Even if the 1962 order prevented earlier title extinction, the unilateral 1974 letters had no legal effect without acceptance. Adverse possession continued from Frederick Buckler's death.</p>
            
            <h4 className="font-bold text-slate-900 mt-6">Family's Stated Beliefs</h4>
            <ul className="list-disc pl-5">
                <li><strong>Historical Entitlement:</strong> Mrs. Buckler believed she held title through her grandfather, John Williams.</li>
                <li><strong>Generational Occupation:</strong> Continuous occupation since 1916.</li>
                <li><strong>Refusal of Landlord Status:</strong> Mrs. Buckler refused formal tenancies or alternative accommodation.</li>
            </ul>

            <h3 className="text-2xl font-serif font-bold text-slate-900 mt-12 mb-6">Court of Appeal Decision (1987)</h3>
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <ul className="list-disc pl-5 space-y-2 text-slate-800">
                    <li>The 1962 possession order effectively tolled the limitation period, preventing title from vesting before December 1974.</li>
                    <li>The October 31, 1974 letters created a valid licence. Mrs. Buckler accepted by conduct (continued occupation), preventing further adverse possession.</li>
                    <li>BP Properties retained valid title throughout the chain from Marquis of Bute.</li>
                </ul>
            </div>

            <h3 className="text-2xl font-serif font-bold text-slate-900 mt-12 mb-6">Unanswered Questions</h3>
            <ul className="list-disc pl-5">
                <li><strong>What Were the Williams Documents?</strong> Mrs. Buckler claimed documentary proof of hereditary title which was never produced.</li>
                <li><strong>Why Wasn't the 1962 Order Enforced for 12 Years?</strong> Suggests possible uncertainty about the legal position or humanitarian considerations.</li>
                <li><strong>Did Mrs. Buckler Actually "Accept" the 1974 Licence?</strong> She followed solicitor advice to "do nothing". Continued occupation was based on claimed ownership, not permission.</li>
                <li><strong>Should Procedure Trump Substance?</strong> Family in possession for 38+ years, defeated by technical operation of unenforced default judgment.</li>
            </ul>
          </div>

          {/* Document 2: Case Analysis & Revised Timeline */}
          <div className="bg-white p-8 md:p-12 shadow-sm border border-slate-200 rounded-lg prose prose-slate max-w-none">
            <h2 className="text-3xl font-serif font-bold text-slate-900 border-b-4 border-justice-red pb-4 mb-8">
              Part II: Revised Timeline & Strategic Analysis
            </h2>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Historical Context & Property Background</h3>
            <p className="italic text-slate-600 mb-4">Great House Farm, Llandough, Vale of Glamorgan</p>
            <ul className="list-disc pl-5">
                <li>Site occupation dates to medieval period (~12th century).</li>
                <li>Farmhouse believed to be approximately 800 years old at time of demolition.</li>
                <li>Located adjacent to St Dochdwy's Church.</li>
                <li>Archaeological significance: medieval soldier burial beneath floor, Roman villa nearby, monastic cemetery on site.</li>
            </ul>
            <p className="font-bold mt-4">Williams/Buckler Family Connection</p>
            <ul className="list-disc pl-5">
                <li>John Williams (maternal grandfather) granted yearly agricultural tenancy by Marquis of Bute in February 1916.</li>
                <li>Family occupancy claims extend to approximately 400 years.</li>
                <li>Frederick Buckler assumed tenancy from 2 February 1949.</li>
                <li>Three generations of continuous occupation: John Williams → Frederick & Mary Buckler → W. Buckler (junior).</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Critical Legal Turning Points</h3>
            
            <h4 className="font-bold text-slate-900 mt-4">The 1962 Possession Order</h4>
            <ul className="list-disc pl-5">
                <li>Obtained by consent or default (Order 14), not full trial on merits.</li>
                <li>Did not adjudicate Williams/Buckler title claims.</li>
                <li>Dormant for nearly 12 years (1962-1974).</li>
                <li>Court of Appeal treated it as "bookmark" preserving landlord's rights.</li>
            </ul>

            <h4 className="font-bold text-slate-900 mt-4">The 1974 Licence Letters</h4>
            <ul className="list-disc pl-5">
                <li>Dated 31 October 1974 from BP Properties Ltd (before conveyance from BP Pension Trust in May 1975).</li>
                <li>Unilateral offer without consideration or acceptance.</li>
                <li>Mrs. Buckler advised by solicitor to "do nothing".</li>
                <li>Court held occupation became licenced, stopping adverse possession clock.</li>
            </ul>

            <h4 className="font-bold text-slate-900 mt-4">Statutory Limitation Analysis</h4>
            <ul className="list-disc pl-5">
                <li>Limitation Act 1939: 12-year adverse possession period.</li>
                <li>Primary Buckler calculation: 1953/1955 + 12 years = 1965/1967.</li>
                <li>Secondary calculation: 1965-1967 (Frederick's death) + 12 years = 1977-1979.</li>
                <li>Court held 1962 order paused limitation period until at least December 1974.</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Legal Strengths & Vulnerabilities</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded border border-green-100">
                    <h4 className="font-bold text-green-800 mb-2">Buckler Family Strengths</h4>
                    <ul className="list-disc pl-5 text-sm text-green-900">
                        <li>Uninterrupted physical occupation (32+ years).</li>
                        <li>Complete cessation of rent payments (34+ years).</li>
                        <li>Generational continuity (three generations).</li>
                        <li>Strong factual possession versus absent landlord.</li>
                        <li>12-year enforcement gap (1962-1974) approaching limitation period.</li>
                    </ul>
                </div>
                <div className="bg-red-50 p-4 rounded border border-red-100">
                    <h4 className="font-bold text-red-800 mb-2">Buckler Family Vulnerabilities</h4>
                    <ul className="list-disc pl-5 text-sm text-red-900">
                        <li>Never sought declaratory judgment of title.</li>
                        <li>No production of alleged "Williams title" documents.</li>
                        <li>Frederick Buckler's 1965 complaint about WGR "refusing to let him the land" weakened animus possidendi claim.</li>
                        <li>Passive response to 1974 letters ("do nothing").</li>
                    </ul>
                </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Analysis of Legal Outcome</h3>
            <p><strong>Procedural vs Substantive Justice:</strong> Court prioritized paper title and procedural orders over long-term factual possession. 1962 default order given disproportionate weight despite lack of title adjudication. 1974 unilateral letters construed as creating licence despite non-acceptance.</p>
            <p className="mt-4"><strong>Systemic Considerations:</strong> Asymmetry between legal title holders and long-term occupiers. Archaeological/heritage value recognized only after demolition. Procedural lawfare advantages for institutional landowners. Generational occupation afforded limited weight in legal calculus.</p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Unresolved Questions & Family Narrative</h3>
            <ul className="list-disc pl-5">
                <li><strong>Family's Historical Claim:</strong> Alleged Daniel Thomas quarry agreement with Bute estate (title swap arrangement). Claimed equitable title passed to Williams family upon quarry completion. Alleged deed held at Cardiff Library (never produced in court).</li>
                <li><strong>Discrepancies Between Narratives:</strong> Official record suggests continuous tenancy until 1955. Family narrative claims ownership via historical arrangement, negating tenancy status. Archaeological timeline of quarrying matches family story but lacks documentation.</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">6. Legal Legacy & Implications</h3>
            <div className="bg-slate-100 p-6 rounded-lg">
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Precedent Value:</strong> Demonstrates power of procedural orders over substantive possession claims. Highlights vulnerability of adverse possession claims to unilateral licence offers.</li>
                    <li><strong>Human Dimension:</strong> Multi-generational family displacement. Elderly, disabled occupant (Mrs. Buckler). 33-year legal struggle ending in demolition of 800-year-old family home. Asymmetric resources between family and corporate entity.</li>
                </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;