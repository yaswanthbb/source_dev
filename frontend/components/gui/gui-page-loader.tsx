import { SourceMark } from "@/components/brand/source-mark";
import gui from "./gui-theme.module.css";
import styles from "./gui-page-loader.module.css";

/** Honest indeterminate feedback: no boot log, synthetic percentage or minimum wait. */
export function GuiPageLoader({
  title = "Opening your page",
  description = "Please wait while we load the next page.",
  inline = false,
}: {
  title?: string;
  description?: string;
  inline?: boolean;
}) {
  return (
    <div
      className={`${gui.theme} ${styles.page} ${inline ? styles.inline : ""}`}
    >
      <div className={styles.status} role="status" aria-atomic="true">
        <div className={styles.brand} aria-hidden="true">
          <SourceMark size={40} />
          <span>source:dev</span>
        </div>
        <strong className={styles.title}>{title}</strong>
        <p>{description}</p>
        <div className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
