export const orcidUrl = "https://orcid.org/0009-0000-7400-9962";

export default function OrcidLink() {
  return (
    <a className="orcid-link" href={orcidUrl} target="_blank" rel="noopener noreferrer" aria-label="View Dr. Kulwant Yadav's ORCID record">
      <span>ORCID iD: 0009-0000-7400-9962</span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}
