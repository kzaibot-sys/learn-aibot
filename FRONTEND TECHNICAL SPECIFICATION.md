FRONTEND TECHNICAL SPECIFICATION
Web & Mobile Architecture
Образовательная Платформа
Version: 1.0
Date: 21.03.2026


1. Technology Stack
1.1 Web Application
•Framework: Next.js 15+ (App Router, React 19)
•Language: TypeScript 5.3+
•Styling: Tailwind CSS 4.0 + shadcn/ui
•State: Zustand 4.x + TanStack Query v5
•Forms: React Hook Form + Zod validation
•Video: Video.js + hls.js (HLS streaming)
•Animations: Framer Motion
1.2 Mobile Applications
•iOS: Swift 5.9+ + SwiftUI + Combine
•Android: Kotlin 1.9+ + Jetpack Compose + Coroutines
•Networking: Alamofire (iOS), Retrofit (Android)
•Video: AVPlayer (iOS), ExoPlayer (Android)


2. Design System
2.1 Color Palette
Современная палитра, основанная на Indigo/Purple gradient:
Name	Hex	Usage	Tailwind
Primary	#4F46E5	Main CTA, links	indigo-600
Secondary	#7C3AED	Premium, accents	purple-600
Success	#059669	Completed states	emerald-600
Text Primary	#111827	Headings, body	gray-900

2.2 Typography
•Primary Font: Inter (variable font)
•Mono Font: JetBrains Mono
•Scale: Tailwind default (text-sm to text-4xl)
2.3 Spacing & Layout
•Base unit: 4px (Tailwind's 1 = 0.25rem)
•Max content width: 1280px (container max-w-7xl)
•Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
•Border radius: rounded-lg (8px) default, rounded-xl (12px) cards


3. Page Structure & Routes
3.1 Public Pages
•/ - Landing page (hero, features, pricing)
•/courses - Course catalog (grid + filters)
•/courses/[slug] - Course detail page
•/login - Sign in page
•/register - Sign up page
3.2 Authenticated Pages
•/dashboard - User dashboard (progress overview)
•/my-courses - Enrolled courses list
•/learn/[courseId] - Course player (video + sidebar)
•/profile - User profile settings
•/certificates - Earned certificates
4. Core Components
4.1 Video Player Component
// components/video-player/VideoPlayer.tsx
import { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string; // HLS m3u8 URL
  onProgress: (time: number) => void;
  resumeTime?: number;
}

export function VideoPlayer({ src, onProgress, resumeTime }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, {
      controls: true,
      fluid: true,
      playbackRates: [0.75, 1, 1.25, 1.5, 2],
      html5: { vhs: { overrideNative: true } }
    });

    player.src({ type: 'application/x-mpegURL', src });
    
    if (resumeTime) {
      player.currentTime(resumeTime);
    }

    player.on('timeupdate', () => {
      onProgress(player.currentTime());
    });

    playerRef.current = player;

    return () => player.dispose();
  }, [src]);

  return <video ref={videoRef} className="video-js vjs-big-play-centered" />;
}

4.2 Course Card Component
// components/course/CourseCard.tsx
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CourseCardProps {
  id: string;
  title: string;
  thumbnail: string;
  instructor: string;
  duration: number;
  students: number;
  rating: number;
  price: number;
  isFree: boolean;
}

export function CourseCard({ id, title, thumbnail, instructor, duration, 
  students, rating, price, isFree }: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <Card className="group hover:shadow-xl transition-all duration-300 
        hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden rounded-t-xl">
          <Image 
            src={thumbnail} 
            alt={title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform"
          />
          {isFree && (
            <Badge className="absolute top-3 right-3 bg-emerald-600">
              Free
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-indigo-600 
            transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600">{instructor}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {Math.floor(duration / 60)}h
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {students.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </span>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <span className="text-2xl font-bold text-indigo-600">
              {isFree ? 'Free' : `$${price}`}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}



5. State Management
5.1 Zustand Store (Auth)
// lib/store/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isPremium: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => 
        set({ user, accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
      updateUser: (userData) => 
        set((state) => ({ user: state.user ? { ...state.user, ...userData } : null })),
    }),
    { name: 'auth-storage' }
  )
);

5.2 TanStack Query (API)
// lib/hooks/use-courses.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useCourses(filters?: CourseFilters) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => api.courses.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => api.courses.getById(id),
    enabled: !!id,
  });
}

export function useEnrollment(courseId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (courseId: string) => api.courses.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}



6. Performance Optimization
6.1 Image Optimization
•Next.js Image component with lazy loading
•WebP format with fallbacks
•Responsive images (srcset) для разных экранов
•CDN delivery через CloudFlare
6.2 Code Splitting
•Route-based splitting (Next.js автоматически)
•Dynamic imports для тяжелых компонентов
•Lazy loading для video player, charts
6.3 Caching Strategy
•TanStack Query cache с staleTime
•Service Worker для offline support
•ISR (Incremental Static Regeneration) для course pages
7. Accessibility (WCAG 2.1 AA)
•Semantic HTML (article, nav, main, section)
•ARIA labels для interactive elements
•Keyboard navigation (Tab, Enter, Escape)
•Focus indicators (ring-2 ring-indigo-600)
•Color contrast ratio >= 4.5:1
•Screen reader support
•Video captions и transcripts


8. Mobile Applications
8.1 iOS Architecture (SwiftUI)
// Views/CourseList/CourseListView.swift
import SwiftUI

struct CourseListView: View {
    @StateObject private var viewModel = CourseListViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(viewModel.courses) { course in
                        CourseCard(course: course)
                            .onTapGesture {
                                viewModel.selectCourse(course)
                            }
                    }
                }
                .padding()
            }
            .navigationTitle("Courses")
            .searchable(text: $viewModel.searchQuery)
            .refreshable {
                await viewModel.refresh()
            }
        }
    }
}

// ViewModels/CourseListViewModel.swift
@MainActor
class CourseListViewModel: ObservableObject {
    @Published var courses: [Course] = []
    @Published var searchQuery = ""
    
    private let apiService = APIService.shared
    
    func loadCourses() async {
        do {
            courses = try await apiService.getCourses()
        } catch {
            // Handle error
        }
    }
}

8.2 Android Architecture (Jetpack Compose)
// ui/screens/CourseListScreen.kt
@Composable
fun CourseListScreen(
    viewModel: CourseListViewModel = hiltViewModel(),
    onCourseClick: (String) -> Unit
) {
    val courses by viewModel.courses.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Courses") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(16.dp)
        ) {
            items(courses) { course ->
                CourseCard(
                    course = course,
                    onClick = { onCourseClick(course.id) }
                )
            }
        }
    }
}

// viewmodel/CourseListViewModel.kt
@HiltViewModel
class CourseListViewModel @Inject constructor(
    private val repository: CourseRepository
) : ViewModel() {
    private val _courses = MutableStateFlow<List<Course>>(emptyList())
    val courses: StateFlow<List<Course>> = _courses.asStateFlow()

    init {
        loadCourses()
    }

    private fun loadCourses() {
        viewModelScope.launch {
            repository.getCourses()
                .collect { result ->
                    _courses.value = result
                }
        }
    }
}



9. Testing Strategy
9.1 Unit Tests (Vitest)
•Components: React Testing Library
•Hooks: @testing-library/react-hooks
•Utils: Pure function tests
9.2 E2E Tests (Playwright)
•Critical flows: Login, enrollment, video playback
•Cross-browser: Chrome, Firefox, Safari
•Mobile viewports
10. Build & Deployment
10.1 Web (Next.js)
•Platform: Vercel / AWS Amplify
•Build: next build (static + server components)
•Environment: staging, production
•CI/CD: GitHub Actions
10.2 Mobile
•iOS: Xcode Cloud / Fastlane → TestFlight → App Store
•Android: Fastlane → Google Play Console (Internal → Beta → Production)
•Code signing: certificates, provisioning profiles
Заключение
Frontend архитектура построена на современных технологиях с акцентом на производительность, доступность и developer experience. Используется единая design system для веб и мобильных приложений, обеспечивающая консистентный UX.
Следующий этап: создание Figma дизайн-макетов для ключевых экранов платформы.