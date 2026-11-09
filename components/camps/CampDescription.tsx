import { parseCampDescription } from "@/lib/camps/description";
import styles from "./CampDescription.module.css";

export default function CampDescription({ description }: { description: string }) {
  const blocks = parseCampDescription(description);
  return <div className={styles.description}>
    {blocks.map((block, index) => block.type === "list"
      ? <ul className={styles.list} key={`list-${index}`}>{block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}</ul>
      : block.type === "highlight"
        ? <p className={styles.highlight} key={`highlight-${index}`}>{block.text}</p>
        : <p className={styles.paragraph} key={`paragraph-${index}`}>{block.text}</p>)}
  </div>;
}
