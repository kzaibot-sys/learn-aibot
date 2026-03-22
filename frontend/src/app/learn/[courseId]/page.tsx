import { CoursePlayerClient } from "@/components/learn/course-player-client";

export default async function LearnCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = await params;
  return <CoursePlayerClient courseId={resolvedParams.courseId} />;
}
