import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import reviewService from "@/services/review.service";
import type { CreateReviewDto, UpdateReviewDto } from "@/types/review.types";

export const useDoctorReviews = (doctorId: string) => {
  return useQuery({
    queryKey: ["reviews", "doctor", doctorId],
    queryFn: () => reviewService.getReviewsByDoctor(doctorId),
    enabled: !!doctorId,
  });
};

export const useMyReviews = () => {
  return useQuery({
    queryKey: ["reviews", "my"],
    queryFn: () => reviewService.getMyReviews(),
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewDto) => reviewService.createReview(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "doctor", variables.doctorId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "my"] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReviewDto }) =>
      reviewService.updateReview(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewService.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};
