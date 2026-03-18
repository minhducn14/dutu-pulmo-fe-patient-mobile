export interface FavoriteResponseDto {
  id: string;
  userId: string;
  doctorId?: string;
  hospitalId?: string;
  doctor?: any; // Generic for now, or import DoctorResponseDto
  hospital?: any;
  createdAt: string;
}

export interface CreateFavoriteDto {
  doctorId?: string;
  hospitalId?: string;
}
