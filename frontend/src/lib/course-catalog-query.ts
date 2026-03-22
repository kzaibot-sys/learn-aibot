import type { CourseListQuery, CourseListSortBy } from "@/lib/api/types";

const SORT_VALUES: CourseListSortBy[] = ["relevance", "newest", "popular"];

function parseSortBy(raw: string | null): CourseListSortBy {
  if (raw && SORT_VALUES.includes(raw as CourseListSortBy)) {
    return raw as CourseListSortBy;
  }
  return "relevance";
}

export function parseCourseListQuery(sp: URLSearchParams): CourseListQuery {
  const pageRaw = sp.get("page");
  const limitRaw = sp.get("limit");
  let page: number | undefined;
  let limit: number | undefined;
  if (pageRaw) {
    const n = Number(pageRaw);
    if (Number.isFinite(n) && n >= 1) page = n;
  }
  if (limitRaw) {
    const n = Number(limitRaw);
    if (Number.isFinite(n) && n >= 1) limit = n;
  }
  return {
    search: sp.get("search")?.trim() || undefined,
    category: sp.get("category")?.trim() || undefined,
    level: sp.get("level")?.trim() || undefined,
    language: sp.get("language")?.trim() || undefined,
    sortBy: parseSortBy(sp.get("sortBy")),
    page,
    limit,
  };
}

/** Builds the query string for GET /courses (omits defaults). */
export function buildCoursesApiQueryString(params: CourseListQuery): string {
  const sp = new URLSearchParams();
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.category?.trim()) sp.set("category", params.category.trim());
  if (params.level?.trim()) sp.set("level", params.level.trim());
  if (params.language?.trim()) sp.set("language", params.language.trim());
  if (params.sortBy && params.sortBy !== "relevance") sp.set("sortBy", params.sortBy);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== 20) sp.set("limit", String(params.limit));
  const s = sp.toString();
  return s ? `?${s}` : "";
}
