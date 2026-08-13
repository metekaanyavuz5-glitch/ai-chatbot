import type { InferUITools, UIMessage } from "ai";
import type { getNews } from "./tools/get-news";
import type { getLinkedInProfile } from "./tools/get-linkedin-profile";
import type { summarizeYoutubeVideo } from "./tools/summarize-youtube";

export type ChatTools = InferUITools<{
  getNews: typeof getNews;
  getLinkedInProfile: typeof getLinkedInProfile;
  summarizeYoutubeVideo: typeof summarizeYoutubeVideo;
}>;

export type CustomUIDataTypes = {
  titleUpdate: { title: string };
};

export type ChatMessage = UIMessage<never, CustomUIDataTypes, ChatTools>;
