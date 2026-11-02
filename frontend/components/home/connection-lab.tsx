"use client";

import { useState } from "react";
import { ArrowUpRight, MoveUpRight } from "lucide-react";
import { SourceMark } from "@/components/brand/source-mark";
import { LEARNING_RECIPE } from "./homepage-data";
import styles from "./homepage-experiment.module.css";

export function ConnectionLab() {
  const [step, setStep] = useState(0);
  const selected = LEARNING_RECIPE[step];

  return (
    <div
      className={styles.lab}
      role="group"
      aria-label="Interactive learning-loop example"
    >
      <div className={styles.labHeading}>
        <span className={styles.labLabel}>A CONCEPT, CONNECTED</span>
        <span className={styles.labStamp}>
          try the learning steps <MoveUpRight size={13} aria-hidden="true" />
        </span>
      </div>
      <div className={styles.map}>
        <span className={styles.mapAnnotation}>
          from the roadmap
          <br />to one concept.
        </span>
        <div className={styles.mapSource}>
          <SourceMark size={49} />
          <span>source:dev</span>
        </div>
        <svg
          className={styles.mapPaths}
          viewBox="0 0 500 420"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M340 85C270 18 170 38 150 125"
            className={step === 0 ? styles.pathActive : undefined}
          />
          <path
            d="M150 125C120 230 265 270 350 225"
            className={step === 1 ? styles.pathActive : undefined}
          />
          <path
            d="M350 225C400 360 250 385 170 330"
            className={step === 2 ? styles.pathActive : undefined}
          />
          <path
            d="M170 330C-10 290 60 50 150 125"
            className={styles.returnPath}
          />
          <path d="m77 161 12-2-2 12" className={styles.mapArrow} />
        </svg>
        {LEARNING_RECIPE.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={step === index}
            aria-controls="connection-lab-description"
            aria-label={`${item.verb}: ${item.node}`}
            onClick={() => setStep(index)}
            className={`${styles.mapNode} ${styles[`node${index}`]} ${step === index ? styles.nodeActive : ""}`}
          >
            <span className={styles.nodeNumber}>{item.number}</span>
            <span>{item.node}</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        ))}
        <span className={styles.mapMarginNote}>
          LEARN IT.
          <br />REVISIT IT.
        </span>
        <svg
          className={styles.mapSpark}
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          <path d="M16 2v28M2 16h28M6 6l20 20M6 26 26 6" />
        </svg>
      </div>
      <div
        className={styles.labControls}
        role="group"
        aria-label="Choose a learning step"
      >
        {LEARNING_RECIPE.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={step === index}
            aria-controls="connection-lab-description"
            onClick={() => setStep(index)}
          >
            <span>{item.number}</span>
            {item.verb}
            <span className={styles.controlDot} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div
        className={styles.labDescription}
        id="connection-lab-description"
        aria-live="polite"
        aria-atomic="true"
      >
        <strong>{selected.caption}</strong>
        <p>{selected.explanation}</p>
      </div>
      <p className={styles.labDisclaimer}>
        Illustrative Git example · no account or progress changes.
      </p>
    </div>
  );
}
