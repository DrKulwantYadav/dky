const services = [
  { tag: "01", title: "Diabetes & metabolic health", text: "Personalised care for type 2 diabetes, obesity, metabolic syndrome and long-term lifestyle risk." },
  { tag: "02", title: "Blood pressure & heart health", text: "Hypertension management, cardiovascular risk review, ECG and echocardiography-guided evaluation." },
  { tag: "03", title: "Fatty liver & digestive care", text: "Evidence-led assessment for fatty liver disease (MASLD), indigestion and gastrointestinal concerns." },
  { tag: "04", title: "Kidney health", text: "Thoughtful evaluation and ongoing care for acute and chronic kidney-related conditions." },
  { tag: "05", title: "Headache, epilepsy & sleep", text: "Integrated care for recurring headaches, seizures, sleep concerns and common mental health conditions." },
  { tag: "06", title: "Infections & respiratory illness", text: "Diagnosis and treatment of fevers, complex infections, respiratory infections and asthma." },
];

const credentials = [
  ["DNB", "General Medicine", "NBEMS, New Delhi"],
  ["FRCEM", "Primary", "Royal College of Emergency Medicine, UK · 2019"],
  ["DCMH", "Community Mental Health", "NIMHANS, Bengaluru · 2018"],
  ["MBBS", "Medicine & Surgery", "U.P. University of Medical Sciences · 2008"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Dr. Kulwant Yadav, home">
          <span className="brand-mark">KY</span>
          <span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#about">About</a><a href="#care">Conditions</a><a href="#credentials">Credentials</a><a href="#research">Research</a>
        </nav>
        <a className="header-cta" href="#visit">Plan your visit <span>↗</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Internal medicine · Bhiwadi</p>
          <h1>Medicine that sees<br /><em>the whole person.</em></h1>
          <p className="hero-lead">Clear answers, careful listening and evidence-based care for complex and everyday health concerns.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#care">Explore areas of care <span>→</span></a>
            <a className="text-link" href="#about">Meet Dr. Yadav <span>↓</span></a>
          </div>
          <div className="trust-row" aria-label="Qualifications and certifications">
            <div><strong>MBBS · DNB</strong><span>General Medicine</span></div>
            <div><strong>FRCEM (Primary)</strong><span>Emergency Medicine, UK</span></div>
            <div><strong>BLS · ACLS</strong><span>AHA Certified</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="portrait-frame"><img src="/dr-kulwant-yadav-portrait.png" alt="Dr. Kulwant Yadav, Consultant in Internal Medicine" /></div>
          <div className="availability-card"><span className="pulse" /><p><strong>Care in Bhiwadi</strong><small>Adult medicine & chronic disease care</small></p></div>
          <div className="hero-stamp" aria-hidden="true">INTERNAL<br />MEDICINE</div>
        </div>
      </section>

      <section className="intro section" id="about">
        <div className="section-label"><span>01</span> Meet your physician</div>
        <div className="intro-grid">
          <h2>Clinical rigour.<br /><em>Human understanding.</em></h2>
          <div className="intro-copy">
            <p className="large-copy">Dr. Kulwant Yadav is a Consultant in Internal Medicine focused on thoughtful, patient-centred care across general medicine, critical care and emergency management.</p>
            <p>His work reflects the health needs of Bhiwadi and South Haryana—from diabetes, blood pressure and fatty liver to infections, sleep concerns and complex multi-system conditions. Every plan begins with understanding the person, not only the report.</p>
            <div className="principles"><span><i>✓</i> Evidence-led decisions</span><span><i>✓</i> Clear, practical explanations</span><span><i>✓</i> Whole-person care</span></div>
          </div>
        </div>
      </section>

      <section className="care section" id="care">
        <div className="section-top">
          <div><div className="section-label light"><span>02</span> Areas of care</div><h2>Care for today.<br /><em>Health for the long term.</em></h2></div>
          <p>Comprehensive adult medicine—from prevention and diagnosis to coordinated long-term management.</p>
        </div>
        <div className="service-grid">
          {services.map((service) => <article className="service-card" key={service.tag}><span>{service.tag}</span><h3>{service.title}</h3><p>{service.text}</p><a href="#visit" aria-label={`Learn more about ${service.title}`}>Learn more <b>↗</b></a></article>)}
        </div>
        <div className="care-note"><strong>Also available</strong><p>Preventive health & metabolic screening · Medical weight management · Lifestyle and sleep counselling · Critical care & emergency resuscitation</p></div>
      </section>

      <section className="approach section">
        <div className="approach-image"><img src="/dr-kulwant-yadav-clinic.png" alt="Dr. Kulwant Yadav in his clinic" /></div>
        <div className="approach-copy">
          <div className="section-label"><span>03</span> The care experience</div>
          <h2>Listen closely.<br /><em>Look deeper.</em></h2>
          <p>Good medicine is not rushed. Dr. Yadav brings together your symptoms, history, lifestyle and investigations to create a plan that makes sense for your life.</p>
          <ol><li><span>1</span><div><strong>Understand the full picture</strong><p>A detailed conversation about what you are feeling and what matters to you.</p></div></li><li><span>2</span><div><strong>Explain with clarity</strong><p>Plain-language guidance so you can make informed decisions with confidence.</p></div></li><li><span>3</span><div><strong>Plan for lasting health</strong><p>Practical treatment, prevention and follow-up shaped around your needs.</p></div></li></ol>
        </div>
      </section>

      <section className="credentials section" id="credentials">
        <div className="section-label"><span>04</span> Education & credentials</div>
        <div className="credentials-head"><h2>Trained to handle<br /><em>the complex.</em></h2><p>Rigorous medical education, international emergency medicine training and continuing development in holistic patient care.</p></div>
        <div className="credential-list">{credentials.map(([abbr, title, place]) => <div className="credential" key={abbr}><b>{abbr}</b><strong>{title}</strong><span>{place}</span></div>)}</div>
        <div className="cert-bar"><span>Advanced life support</span><strong>American Heart Association certified BLS & ACLS provider</strong><small>Max Institute of Excellence, New Delhi</small></div>
      </section>

      <section className="research section" id="research">
        <div className="research-intro"><div className="section-label light"><span>05</span> Research & scholarship</div><h2>Care informed by<br /><em>curiosity.</em></h2><p>Active clinical research and peer-reviewed work in metabolic disease, cardiovascular health and critical care.</p></div>
        <div className="research-list">
          <article><span>Ongoing multicentre study</span><h3>Real-world effectiveness of Saroglitazar in women with MASLD</h3><p>Observational research on liver fat and fibrosis outcomes in real clinical practice.</p></article>
          <article><span>Peer-reviewed · 2025</span><h3>Chawla’s Modified Griggs Percutaneous Tracheostomy</h3><p>A safe, cost-effective alternative for resource-limited intensive care units.</p></article>
          <article><span>DNB thesis</span><h3>Echocardiographic changes in type 2 diabetes</h3><p>Exploring BMI, waist–hip ratio and structural heart changes in metabolic disease.</p></article>
        </div>
      </section>

      <section className="visit section" id="visit">
        <p className="eyebrow"><span /> Your health deserves time and attention</p>
        <h2>Start with a<br /><em>clear conversation.</em></h2>
        <p>Consultations for adults in Bhiwadi, with a focus on careful diagnosis, understandable guidance and long-term wellbeing.</p>
        <a className="primary-button" href="#care">Review areas of care <span>→</span></a>
        <small>For urgent or life-threatening symptoms, please contact local emergency services immediately.</small>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a>
        <p>Patient-centred adult medicine in Bhiwadi, Rajasthan.</p>
        <div><a href="#about">About</a><a href="#care">Conditions</a><a href="#credentials">Credentials</a><a href="#research">Research</a></div>
        <small>© {new Date().getFullYear()} Dr. Kulwant Yadav. Medical information on this website is educational and does not replace a consultation.</small>
      </footer>
    </main>
  );
}
