export interface ReviewResponseDto {
  id: string;
  reviewerId: string;
  doctorId: string;
  appointmentId?: string;
  comment: string;
  rating: number;
  doctorResponse?: string;
  responseAt?: string;
  isAnonymous: boolean;
  createdAt: string;
  reviewerName?: string;
  doctorName?: string;
  reviewerAvatar?: string;
  doctorAvatar?: string;
}

export interface CreateReviewDto {
  doctorId: string;
  appointmentId?: string;
  comment: string;
  rating: number;
  isAnonymous?: boolean;
}

export interface UpdateReviewDto {
  comment?: string;
  rating?: number;
  isAnonymous?: boolean;
}
