export type CorpusVideo = {
  id: string;
  src: string;
  title: string;
};

export type Corpus = {
  id: string;
  label: string;
  videos: CorpusVideo[];
};

export const corpora: Record<string, Corpus> = {
  soccer: {
    id: "soccer",
    label: "Soccer",
    videos: [
      {
        id: "videoplayback",
        src: "/videos/videoplayback.mp4",
        title: "Soccer highlights — match clip 1",
      },
      {
        id: "videoplayback-1",
        src: "/videos/videoplayback (1).mp4",
        title: "Soccer highlights — match clip 2",
      },
      {
        id: "videoplayback-2",
        src: "/videos/videoplayback (2).mp4",
        title: "Soccer highlights — match clip 3",
      },
      {
        id: "videoplayback-3",
        src: "/videos/videoplayback (3).mp4",
        title: "Soccer highlights — match clip 4",
      },
      {
        id: "videoplayback-4",
        src: "/videos/videoplayback (4).mp4",
        title: "Soccer highlights — match clip 5",
      },
      {
        id: "videoplayback-5",
        src: "/videos/videoplayback (5).mp4",
        title: "Soccer highlights — match clip 6",
      },
    ],
  },
};

export const corpusList = Object.values(corpora);

export const defaultCorpusId = "soccer";
