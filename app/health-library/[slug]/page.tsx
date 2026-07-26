import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getLibraryTopic,libraryTopics} from "../data";
import ConsultationActions from "../../ConsultationActions";
import {pageMetadata} from "../../seo";

export function generateStaticParams(){return libraryTopics.map(({slug})=>({slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const topic=getLibraryTopic(slug);return topic?pageMetadata({title:topic.title,description:topic.summary,path:`/health-library/${topic.slug}`,type:"article"}):{title:"Article not found",robots:{index:false,follow:false}}}

export default async function LibraryArticle({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const topic=getLibraryTopic(slug);if(!topic)notFound();const related=libraryTopics.filter(item=>item.slug!==topic.slug).slice(0,2);return <main className="library-article-page">
  <header className="simple-header"><a className="brand" href="/"><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a><nav><a href="/health-library">Health library</a><a href="/conditions">Conditions</a><a href="/services">Services</a></nav><a href="/book-appointment" className="header-cta">Book appointment</a></header>
  <article className="library-article"><header className="article-hero"><a href="/health-library" className="back-link">← All health topics</a><p className="eyebrow"><span/> {topic.category}</p><h1>{topic.title}</h1><div className="article-meta"><span>Patient guide</span><span>{topic.readTime}</span><span>Reviewed for general education</span></div><p className="article-intro">{topic.introduction}</p></header>
    <div className="article-layout"><aside className="article-takeaways"><span>Key points</span><ul>{topic.keyPoints.map(point=><li key={point}>{point}</li>)}</ul></aside><div className="article-body">{topic.sections.map((section,index)=><section key={section.heading}><span className="article-number">{String(index+1).padStart(2,"0")}</span><h2>{section.heading}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}{section.bullets&&<ul>{section.bullets.map(item=><li key={item}>{item}</li>)}</ul>}</section>)}<section className="article-urgent"><span>Seek urgent care</span><h2>Warning signs that should not wait</h2><ul>{topic.urgent.map(item=><li key={item}>{item}</li>)}</ul><p>If symptoms are severe, sudden or life-threatening, visit the nearest emergency department.</p></section></div></div>
  </article>
  <section className="related-articles"><div><p className="section-label"><span>More</span> Health library</p><h2>Continue reading</h2></div><div>{related.map(item=><a href={`/health-library/${item.slug}`} key={item.slug}><span>{item.category}</span><strong>{item.title}</strong><small>{item.readTime} →</small></a>)}</div></section>
  <ConsultationActions tone="ivory" />
</main>}
