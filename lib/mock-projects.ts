import type { Project } from "@/types/project";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "mock-1",
    name: "Payments Platform",
    slug: "payments-platform",
    isOwner: true,
  },
  {
    id: "mock-2",
    name: "Realtime Chat Backend",
    slug: "realtime-chat-backend",
    isOwner: true,
  },
  {
    id: "mock-3",
    name: "Analytics Pipeline",
    slug: "analytics-pipeline",
    isOwner: true,
  },
  {
    id: "mock-4",
    name: "Checkout Microservices",
    slug: "checkout-microservices",
    isOwner: false,
  },
  {
    id: "mock-5",
    name: "Media Streaming Service",
    slug: "media-streaming-service",
    isOwner: false,
  },
];
