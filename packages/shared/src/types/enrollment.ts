export interface EnrollmentInfo {
  courseId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  enrolledAt: string;
  expiresAt: string | null;
}
