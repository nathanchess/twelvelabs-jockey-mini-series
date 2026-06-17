import Image from "next/image";
import { SeriesLearningSection } from "@/components/series/SeriesLearningSection";
import { StrandButton } from "@/components/strand/StrandButton";
import { StrandIcon } from "@/components/strand/StrandIcon";

const REPO_URL =
  "https://github.com/nathanchess/twelvelabs-jockey-mini-series";

export default function OverviewPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-[1200px] shrink-0 px-8 py-10">
        <div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
          <Image
            src="/strand/logo-mark.svg"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4"
          />
          <span>TwelveLabs · Jockey Mini Series</span>
        </div>

        <h1 className="mb-4 max-w-2xl text-[40px] font-medium leading-tight tracking-tight text-text-primary">
          Jockey Arena
        </h1>
        <p className="mb-8 max-w-xl text-lg text-text-secondary">
          Compare TwelveLabs Jockey against leading video-language models on shared
          corpora. Run the same prompts side by side and measure latency, tokens,
          and cost.
        </p>

        <div className="flex flex-wrap gap-3">
          <StrandButton variant="highlight" size="medium" href="/arena">
            Open Arena
            <StrandIcon name="arrow-diagonal" className="h-4 w-4" />
          </StrandButton>
          <StrandButton
            variant="black"
            size="medium"
            href="https://docs.twelvelabs.io"
            external
          >
            Read the Docs
            <StrandIcon name="arrow-diagonal" className="h-4 w-4" />
          </StrandButton>
          <StrandButton
            variant="black-outline"
            size="medium"
            href={REPO_URL}
            external
          >
            View Source
            <StrandIcon name="arrow-diagonal" className="h-4 w-4" />
          </StrandButton>
        </div>
      </div>

      <SeriesLearningSection />
    </div>
  );
}
